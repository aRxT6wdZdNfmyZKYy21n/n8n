import type { Plugin } from 'vue';
import type { ITelemetrySettings } from '@n8n/api-types';
import type { ITelemetryTrackProperties, IDataObject } from 'n8n-workflow';
import type { RouteLocation } from 'vue-router';

import type { IUpdateInformation } from '@/Interface';
import type { RudderStack } from './telemetry.types';
import {
	APPEND_ATTRIBUTION_DEFAULT_PATH,
	MICROSOFT_TEAMS_NODE_TYPE,
	SLACK_NODE_TYPE,
	TELEGRAM_NODE_TYPE,
} from '@/constants';
import { useRootStore } from '@n8n/stores/useRootStore';
import { useNDVStore } from '@/features/ndv/ndv.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';
import { usePostHog } from '@/stores/posthog.store';

export class Telemetry {
	private pageEventQueue: Array<{ route: RouteLocation }>;

	private previousPath: string;

	private get rudderStack(): RudderStack | undefined {
		return window.rudderanalytics;
	}

	constructor() {
		this.pageEventQueue = [];
		this.previousPath = '';
	}

	init(
		telemetrySettings: ITelemetrySettings,
		{
			instanceId,
			userId,
			projectId,
			versionCli,
		}: {
			instanceId: string;
			userId?: string;
			projectId?: string;
			versionCli: string;
		},
	) {
		// Telemetry completely disabled for self-hosted version
		return;
	}

	identify(instanceId: string, userId?: string, versionCli?: string, projectId?: string) {
		// Telemetry disabled for self-hosted version
		return;
	}

	track(event: string, properties?: ITelemetryTrackProperties) {
		// Telemetry disabled for self-hosted version
		return;
	}

	page(route: RouteLocation) {
		// Telemetry disabled for self-hosted version
		return;
	}

	reset() {
		// Telemetry disabled for self-hosted version
		return;
	}

	flushPageEvents() {
		// Telemetry disabled for self-hosted version
		return;
	}

	trackAskAI(event: string, properties: IDataObject = {}) {
		// Telemetry disabled for self-hosted version
		return;
	}

	trackAiTransform(event: string, properties: IDataObject = {}) {
		// Telemetry disabled for self-hosted version
		return;
	}

	trackNodeParametersValuesChange(nodeType: string, change: IUpdateInformation) {
		// Telemetry disabled for self-hosted version
		return;
	}

	private initRudderStack(key: string, proxy: string, options: IDataObject) {
		// RudderStack initialization disabled for self-hosted version
		return;
	}
}

export const telemetry = new Telemetry();

export const TelemetryPlugin: Plugin = {
	install(app) {
		app.config.globalProperties.$telemetry = telemetry;
	},
};
