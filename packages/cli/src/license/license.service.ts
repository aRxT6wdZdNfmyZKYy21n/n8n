import { LicenseState, Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { WorkflowRepository } from '@n8n/db';
import { Service } from '@n8n/di';
import axios, { AxiosError } from 'axios';
import { ensureError } from 'n8n-workflow';

import { BadRequestError } from '@/errors/response-errors/bad-request.error';
import { EventService } from '@/events/event.service';
import { License } from '@/license';
import { UrlService } from '@/services/url.service';

type LicenseError = Error & { errorId?: keyof typeof LicenseErrors };

export const LicenseErrors = {
	SCHEMA_VALIDATION: 'Activation key is in the wrong format',
	RESERVATION_EXHAUSTED: 'Activation key has been used too many times',
	RESERVATION_EXPIRED: 'Activation key has expired',
	NOT_FOUND: 'Activation key not found',
	RESERVATION_CONFLICT: 'Activation key not found',
	RESERVATION_DUPLICATE: 'Activation key has already been used on this instance',
};

@Service()
export class LicenseService {
	constructor(
		private readonly logger: Logger,
		private readonly license: License,
		private readonly licenseState: LicenseState,
		private readonly workflowRepository: WorkflowRepository,
		private readonly urlService: UrlService,
		private readonly eventService: EventService,
	) {}

	async getLicenseData() {
		const triggerCount = await this.workflowRepository.getActiveTriggerCount();
		const workflowsWithEvaluationsCount =
			await this.workflowRepository.getWorkflowsWithEvaluationCount();
		const mainPlan = this.license.getMainPlan();

		return {
			usage: {
				activeWorkflowTriggers: {
					value: triggerCount,
					limit: this.license.getTriggerLimit(),
					warningThreshold: 0.8,
				},
				workflowsHavingEvaluations: {
					value: workflowsWithEvaluationsCount,
					limit: this.licenseState.getMaxWorkflowsWithEvaluations(),
				},
			},
			license: {
				planId: mainPlan?.productId ?? '',
				planName: this.license.getPlanName(),
			},
		};
	}

	async requestEnterpriseTrial(user: User) {
		// Enterprise trial requests disabled for self-hosted version
		this.logger.debug('Enterprise trial requests disabled for self-hosted version');
		return;
	}

	async registerCommunityEdition({
		userId,
		email,
		instanceId,
		instanceUrl,
		licenseType,
	}: {
		userId: User['id'];
		email: string;
		instanceId: string;
		instanceUrl: string;
		licenseType: string;
	}): Promise<{ title: string; text: string }> {
		// Community edition registration disabled for self-hosted version
		this.logger.debug('Community edition registration disabled for self-hosted version');
		return {
			title: 'Self-Hosted Edition',
			text: 'All features are enabled in the self-hosted version.',
		};
	}

	getManagementJwt(): string {
		return this.license.getManagementJwt();
	}

	async activateLicense(activationKey: string) {
		// License activation disabled for self-hosted version
		this.logger.debug('License activation disabled for self-hosted version');
		return;
	}

	async renewLicense() {
		// License renewal disabled for self-hosted version
		this.logger.debug('License renewal disabled for self-hosted version');
		return;
	}

	private mapErrorMessage(error: LicenseError, action: 'activate' | 'renew') {
		let message = error.errorId && LicenseErrors[error.errorId];
		if (!message) {
			message = `Failed to ${action} license: ${error.message}`;
			this.logger.error(message, { stack: error.stack ?? 'n/a' });
		}
		return message;
	}
}
