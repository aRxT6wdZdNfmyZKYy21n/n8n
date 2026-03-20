import { LoginRequestDto, ResolveSignupTokenQueryDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { Time } from '@n8n/constants';
import type { User, PublicUser, AuthProviderType } from '@n8n/db';
import {
	UserRepository,
	AuthenticatedRequest,
	GLOBAL_MEMBER_ROLE,
	GLOBAL_OWNER_ROLE,
} from '@n8n/db';
import {
	Body,
	createBodyKeyedRateLimiter,
	Get,
	Post,
	Query,
	RestController,
} from '@n8n/decorators';
import { isEmail } from 'class-validator';
import { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { verify, type JwtPayload } from 'jsonwebtoken';

import { AuthHandlerRegistry } from '@/auth/auth-handler.registry';
import { AuthService } from '@/auth/auth.service';
import { RESPONSE_ERROR_MESSAGES } from '@/constants';
import { AuthError } from '@/errors/response-errors/auth.error';
import { BadRequestError } from '@/errors/response-errors/bad-request.error';
import { ForbiddenError } from '@/errors/response-errors/forbidden.error';
import { InternalServerError } from '@/errors/response-errors/internal-server.error';
import { EventService } from '@/events/event.service';
import { License } from '@/license';
import { MfaService } from '@/mfa/mfa.service';
import { PostHogClient } from '@/posthog';
import { AuthlessRequest } from '@/requests';
import { PasswordUtility } from '@/services/password.utility';
import { UserService } from '@/services/user.service';
import {
	getCurrentAuthenticationMethod,
	isOidcCurrentAuthenticationMethod,
	isSamlCurrentAuthenticationMethod,
	isSsoCurrentAuthenticationMethod,
} from '@/sso.ee/sso-helpers';
import '../auth/handlers/email.auth-handler';

@RestController()
export class AuthController {
	private readonly trustedAuthUsedJtis = new Map<string, number>();

	constructor(
		private readonly logger: Logger,
		private readonly authService: AuthService,
		private readonly mfaService: MfaService,
		private readonly userService: UserService,
		private readonly passwordUtility: PasswordUtility,
		private readonly license: License,
		private readonly userRepository: UserRepository,
		private readonly eventService: EventService,
		private readonly authHandlerRegistry: AuthHandlerRegistry,
		private readonly postHog?: PostHogClient,
	) {}

	/** Log in a user */
	@Post('/login', {
		skipAuth: true,
		// Two layered rate limit to ensure multiple users can login from the same
		// IP address but aggressive per email limit.
		ipRateLimit: {
			limit: 1000,
			windowMs: 5 * Time.minutes.toMilliseconds,
		},
		keyedRateLimit: createBodyKeyedRateLimiter<LoginRequestDto>({
			limit: 5,
			windowMs: 1 * Time.minutes.toMilliseconds,
			field: 'emailOrLdapLoginId',
		}),
	})
	async login(
		req: AuthlessRequest,
		res: Response,
		@Body payload: LoginRequestDto,
	): Promise<PublicUser | undefined> {
		const { emailOrLdapLoginId, password, mfaCode, mfaRecoveryCode } = payload;

		const currentAuthenticationMethod = getCurrentAuthenticationMethod();
		this.validateEmailFormat(currentAuthenticationMethod, emailOrLdapLoginId);

		const emailHandler = this.authHandlerRegistry.get('email', 'password');
		if (!emailHandler) {
			this.logger.error('Email authentication handler is not registered');
			throw new InternalServerError('Email authentication method not available');
		}

		const preliminaryUser = await emailHandler.handleLogin(emailOrLdapLoginId, password);
		this.validateSsoRestrictions(preliminaryUser);

		const { user, usedAuthenticationMethod } = await this.authenticateWithPassword(
			currentAuthenticationMethod,
			emailOrLdapLoginId,
			password,
			preliminaryUser,
		);

		if (user.settings?.ldapBlocked === true) {
			throw new AuthError('Access denied. Your account is currently blocked.');
		}
		if (this.isTrustedAuthEnabled() && user.role.slug !== GLOBAL_OWNER_ROLE.slug) {
			throw new AuthError('Password login is disabled. Please use company login.');
		}

		await this.validateMfa(user, mfaCode, mfaRecoveryCode);

		this.authService.issueCookie(res, user, user.mfaEnabled, req.browserId);

		this.eventService.emit('user-logged-in', {
			user,
			authenticationMethod: usedAuthenticationMethod,
		});

		return await this.userService.toPublic(user, {
			posthog: this.postHog,
			withScopes: true,
			mfaAuthenticated: user.mfaEnabled,
		});
	}

	@Get('/internal/auth/trusted-login', { skipAuth: true })
	async trustedLogin(
		req: AuthlessRequest,
		res: Response,
	) {
		const query = req.query as Record<string, string | string[] | undefined>;
		const tokenQuery = query.token;
		const redirectQuery = query.redirect;

		// Express may represent query params as string|string[]|undefined
		const token = Array.isArray(tokenQuery) ? tokenQuery[0] : tokenQuery;
		const redirect = Array.isArray(redirectQuery) ? redirectQuery[0] : redirectQuery;

		if (!this.isTrustedAuthEnabled()) {
			throw new ForbiddenError('Trusted auth is not enabled');
		}

		this.logger.debug('Trusted login request received', {
			originalUrl: req.originalUrl,
			query: req.query,
			hasToken: Boolean(token),
			tokenLength: token?.length ?? 0,
		});

		if (!token) {
			throw new BadRequestError('Missing trusted login token');
		}

		const claims = this.verifyTrustedToken(token);
		this.consumeTrustedJti(claims.jti, claims.exp);

		const role = this.resolveRoleFromGroups(claims.groups);
		if (!role) {
			throw new ForbiddenError('User is not in any allowed group');
		}

		const user = await this.upsertTrustedUser({
			email: claims.email,
			firstName: claims.firstName,
			lastName: claims.lastName,
			role,
		});

		this.authService.issueCookie(res, user, true, req.browserId);
		this.eventService.emit('user-logged-in', {
			user,
			authenticationMethod: 'ldap',
		});

		res.redirect(redirect ?? '/');
	}

	private validateEmailFormat(authMethod: AuthProviderType, emailOrLdapLoginId: string): void {
		if (authMethod === 'email' && !isEmail(emailOrLdapLoginId)) {
			throw new BadRequestError('Invalid email address');
		}
	}

	private validateSsoRestrictions(preliminaryUser: User | undefined): void {
		const shouldBlockSsoUser =
			(isSamlCurrentAuthenticationMethod() || isOidcCurrentAuthenticationMethod()) &&
			preliminaryUser?.role.slug !== GLOBAL_OWNER_ROLE.slug &&
			!preliminaryUser?.settings?.allowSSOManualLogin;

		if (shouldBlockSsoUser) {
			throw new AuthError('SSO is enabled, please log in with SSO');
		}
	}

	private async authenticateWithPassword(
		getCurrentAuthenticationMethod: AuthProviderType,
		emailOrLdapLoginId: string,
		password: string,
		preliminaryUser: User | undefined,
	): Promise<{ user: User; usedAuthenticationMethod: AuthProviderType }> {
		let user = preliminaryUser;
		let usedAuthenticationMethod: AuthProviderType = 'email';

		const shouldTryAlternativeAuth =
			getCurrentAuthenticationMethod !== 'email' &&
			preliminaryUser?.role.slug !== GLOBAL_OWNER_ROLE.slug;

		if (shouldTryAlternativeAuth) {
			const authHandler = this.authHandlerRegistry.get(getCurrentAuthenticationMethod, 'password');
			if (authHandler) {
				user = await authHandler.handleLogin(emailOrLdapLoginId, password);
				usedAuthenticationMethod = getCurrentAuthenticationMethod;
			}
		}

		if (!user) {
			this.eventService.emit('user-login-failed', {
				authenticationMethod: usedAuthenticationMethod,
				userEmail: emailOrLdapLoginId,
				reason: 'wrong credentials',
			});
			throw new AuthError('Wrong username or password. Do you have caps lock on?');
		}

		return { user, usedAuthenticationMethod };
	}

	private async validateMfa(
		user: User,
		mfaCode: string | undefined,
		mfaRecoveryCode: string | undefined,
	): Promise<void> {
		if (!user.mfaEnabled) {
			return;
		}

		if (!mfaCode && !mfaRecoveryCode) {
			throw new AuthError('MFA Error', 998);
		}

		const isMfaCodeOrMfaRecoveryCodeValid = await this.mfaService.validateMfa(
			user.id,
			mfaCode,
			mfaRecoveryCode,
		);

		if (!isMfaCodeOrMfaRecoveryCodeValid) {
			throw new AuthError('Invalid mfa token or recovery code');
		}
	}

	/** Check if the user is already logged in */
	@Get('/login', {
		allowSkipMFA: true,
	})
	async currentUser(req: AuthenticatedRequest): Promise<PublicUser> {
		// We need auth identities to determine signInType in toPublic method
		const user = await this.userService.findUserWithAuthIdentities(req.user.id);

		return await this.userService.toPublic(user, {
			posthog: this.postHog,
			withScopes: true,
			mfaAuthenticated: req.authInfo?.usedMfa,
		});
	}

	/** Validate invite token to enable invitee to set up their account */
	@Get('/resolve-signup-token', { skipAuth: true })
	async resolveSignupToken(
		_req: AuthlessRequest,
		_res: Response,
		@Query payload: ResolveSignupTokenQueryDto,
	) {
		if (isSsoCurrentAuthenticationMethod()) {
			this.logger.debug(
				'Invite links are not supported on this system, please use single sign on instead.',
			);
			throw new BadRequestError(
				'Invite links are not supported on this system, please use single sign on instead.',
			);
		}

		const { inviterId, inviteeId } = await this.userService.getInvitationIdsFromPayload(payload);

		const isWithinUsersLimit = this.license.isWithinUsersLimit();

		if (!isWithinUsersLimit) {
			this.logger.debug('Request to resolve signup token failed because of users quota reached', {
				inviterId,
				inviteeId,
			});
			throw new ForbiddenError(RESPONSE_ERROR_MESSAGES.USERS_QUOTA_REACHED);
		}

		const users = await this.userRepository.findManyByIds([inviterId, inviteeId], {
			includeRole: true,
		});

		if (users.length !== 2) {
			this.logger.debug(
				'Request to resolve signup token failed because the ID of the inviter and/or the ID of the invitee were not found in database',
				{ inviterId, inviteeId },
			);
			throw new BadRequestError('Invalid invite URL');
		}

		const invitee = users.find((user) => user.id === inviteeId);
		if (!invitee || invitee.password) {
			this.logger.error('Invalid invite URL - invitee already setup', {
				inviterId,
				inviteeId,
			});
			throw new BadRequestError('The invitation was likely either deleted or already claimed');
		}

		const inviter = users.find((user) => user.id === inviterId);
		if (!inviter?.email || !inviter?.firstName) {
			this.logger.error(
				'Request to resolve signup token failed because inviter does not exist or is not set up',
				{
					inviterId: inviter?.id,
				},
			);
			throw new BadRequestError('Invalid request');
		}

		this.eventService.emit('user-invite-email-click', { inviter, invitee });

		const { firstName, lastName } = inviter;
		return { inviter: { firstName, lastName } };
	}

	/** Log out a user */
	@Post('/logout')
	async logout(req: AuthenticatedRequest, res: Response) {
		await this.authService.invalidateToken(req);
		this.authService.clearCookie(res);
		return { loggedOut: true };
	}

	private isTrustedAuthEnabled() {
		return process.env.N8N_TRUSTED_AUTH_ENABLED === 'true';
	}

	private getTrustedAuthSecret() {
		const secret = process.env.N8N_TRUSTED_AUTH_SECRET;
		if (!secret) {
			throw new InternalServerError('N8N_TRUSTED_AUTH_SECRET is not configured');
		}
		return secret;
	}

	private verifyTrustedToken(token: string): {
		email: string;
		firstName?: string;
		lastName?: string;
		groups: string[];
		jti: string;
		exp: number;
	} {
		let decoded: string | JwtPayload;
		try {
			decoded = verify(token, this.getTrustedAuthSecret(), { algorithms: ['HS256'] });
		} catch {
			throw new ForbiddenError('Invalid trusted login token');
		}
		if (typeof decoded === 'string') {
			throw new ForbiddenError('Invalid trusted login token payload');
		}

		const email =
			typeof decoded.email === 'string'
				? decoded.email
				: typeof decoded.sub === 'string'
					? decoded.sub
					: undefined;
		const jti = typeof decoded.jti === 'string' ? decoded.jti : undefined;
		const exp = typeof decoded.exp === 'number' ? decoded.exp : undefined;
		const groups =
			Array.isArray(decoded.groups) && decoded.groups.every((g) => typeof g === 'string')
				? (decoded.groups as string[])
				: [];

		if (!email || !jti || !exp) {
			throw new ForbiddenError('Invalid trusted login token claims');
		}

		return {
			email: email.toLowerCase(),
			firstName: typeof decoded.firstName === 'string' ? decoded.firstName : undefined,
			lastName: typeof decoded.lastName === 'string' ? decoded.lastName : undefined,
			groups,
			jti,
			exp,
		};
	}

	private consumeTrustedJti(jti: string, expSeconds: number) {
		const now = Date.now();
		for (const [key, expiresAt] of this.trustedAuthUsedJtis.entries()) {
			if (expiresAt <= now) this.trustedAuthUsedJtis.delete(key);
		}

		if (this.trustedAuthUsedJtis.has(jti)) {
			throw new ForbiddenError('Trusted login token replay detected');
		}
		this.trustedAuthUsedJtis.set(jti, expSeconds * 1000);
	}

	private resolveRoleFromGroups(groups: string[]): 'global:member' | 'global:admin' | null {
		const rawMap = process.env.N8N_TRUSTED_AUTH_GROUP_ROLE_MAP;
		const groupRoleMap = rawMap
			? (JSON.parse(rawMap) as Record<string, string>)
			: {
					n8n_users: 'global:member',
					n8n_admins: 'global:admin',
				};

		const normalizedGroups = new Set<string>();
		for (const g of groups) {
			const lower = g.toLowerCase().trim();
			normalizedGroups.add(lower);
			const match = /cn=([^,]+)/i.exec(g);
			if (match?.[1]) normalizedGroups.add(match[1].toLowerCase().trim());
		}

		let resolved: 'global:member' | 'global:admin' | null = null;
		for (const [groupName, role] of Object.entries(groupRoleMap)) {
			if (!normalizedGroups.has(groupName.toLowerCase().trim())) continue;
			if (role === 'global:admin') return 'global:admin';
			if (role === 'global:member') resolved = 'global:member';
		}
		return resolved;
	}

	private async upsertTrustedUser(params: {
		email: string;
		firstName?: string;
		lastName?: string;
		role: 'global:member' | 'global:admin';
	}) {
		const { email, firstName, lastName, role } = params;
		const existing = await this.userRepository.findOne({
			where: { email },
			relations: ['role'],
		});

		if (!existing) {
			const randomPassword = await this.passwordUtility.hash(randomUUID());
			const { user } = await this.userRepository.createUserWithProject({
				email,
				firstName,
				lastName,
				password: randomPassword,
				role: { slug: role },
				settings: { ldapBlocked: false },
			});
			return user;
		}

		if (existing.role.slug !== GLOBAL_OWNER_ROLE.slug && existing.role.slug !== role) {
			existing.role = { ...GLOBAL_MEMBER_ROLE, slug: role };
		}
		existing.firstName = firstName ?? existing.firstName;
		existing.lastName = lastName ?? existing.lastName;
		existing.settings = {
			...(existing.settings ?? {}),
			ldapBlocked: false,
		};
		return await this.userRepository.save(existing);
	}
}
