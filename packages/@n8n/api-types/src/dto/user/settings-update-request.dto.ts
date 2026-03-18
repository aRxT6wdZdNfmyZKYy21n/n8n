import { z } from 'zod';

import { Z } from '../../zod-class';

export class SettingsUpdateRequestDto extends Z.class({
	userActivated: z.boolean().optional(),
	allowSSOManualLogin: z.boolean().optional(),
	easyAIWorkflowOnboarded: z.boolean().optional(),
	dismissedCallouts: z.record(z.string(), z.boolean()).optional(),
	/** Set by ldap-sync to block login when user lost AD group membership. */
	ldapBlocked: z.boolean().optional(),
}) {}
