import { GlobalConfig } from '@n8n/config';
import type { PublicUser } from '@n8n/db';
import { Service } from '@n8n/di';
import { InstanceSettings } from 'n8n-core';
import type { FeatureFlags, ITelemetryTrackProperties } from 'n8n-workflow';
import type { PostHog } from 'posthog-node';

/**
 * PostHog group type for instance-level properties.
 * Note: Aliased as "instance" on PostHog dashboard
 */
const POSTHOG_GROUP_TYPE_INSTANCE = 'company';

@Service()
export class PostHogClient {
	// In this fork we completely disable PostHog usage
	// while keeping the public API for callers intact.

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	constructor(
		private readonly instanceSettings: InstanceSettings,
		private readonly globalConfig: GlobalConfig,
	) {}

	async init() {
		// No-op: do not initialize PostHog client or perform any network calls
		return;
	}

	async stop(): Promise<void> {
		// No-op: nothing to shut down
		return;
	}

	track(_payload: { userId: string; event: string; properties: ITelemetryTrackProperties }): void {
		// No-op: tracking disabled
	}

	groupIdentify(_args: {
		instanceId: string;
		distinctId?: string;
		properties: Record<string, string | number> | undefined;
	}): void {
		// No-op: group identification disabled
	}

	identify(_args: {
		distinctId: string;
		properties: Record<string | number, unknown> | undefined;
	}): void {
		// No-op: identification disabled
	}

	async getFeatureFlags(_user: Pick<PublicUser, 'id' | 'createdAt'>): Promise<FeatureFlags> {
		// Always return empty flags to avoid contacting PostHog
		return {};
	}
}
