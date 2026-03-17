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
} from '@/app/constants';
import { useRootStore } from '@n8n/stores/useRootStore';
import { useNDVStore } from '@/features/ndv/shared/ndv.store';
import { useSettingsStore } from '@/app/stores/settings.store';
import { useUIStore } from '@/app/stores/ui.store';
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
		// In this fork, all frontend telemetry is disabled.
		// Keep method signature for compatibility but do nothing.
		return;
	}

	identify(instanceId: string, userId?: string, versionCli?: string, projectId?: string) {
		const settingsStore = useSettingsStore();
		const traits: { instance_id: string; version_cli?: string; user_cloud_id?: string } = {
			instance_id: instanceId,
			version_cli: versionCli,
		};

		if (settingsStore.isCloudDeployment) {
			traits.user_cloud_id = settingsStore.settings?.n8nMetadata?.userId ?? '';
		}
		if (userId) {
			this.rudderStack?.identify(
				`${instanceId}#${userId}${projectId ? '#' + projectId : ''}`,
				traits,
				{
					context: {
						// provide a fake IP address to instruct RudderStack to not use the user's IP address
						ip: '0.0.0.0',
					},
				},
			);
		} else {
			this.rudderStack?.reset();
		}
	}

	track(event: string, properties?: ITelemetryTrackProperties) {
		// No-op: telemetry tracking disabled
		return;
	}

	page(route: RouteLocation) {
		// No-op: page tracking disabled
		return;
	}

	reset() {
		this.rudderStack?.reset();
	}

	flushPageEvents() {
		const queue = this.pageEventQueue;
		this.pageEventQueue = [];
		queue.forEach(({ route }) => {
			this.page(route);
		});
	}

	trackAskAI(event: string, properties: IDataObject = {}) {
		// No-op
		return;
	}

	trackAiTransform(event: string, properties: IDataObject = {}) {
		// No-op
		return;
	}

	// We currently do not support tracking directly from within node implementation
	// so we are using this method as centralized way to track node parameters changes
	trackNodeParametersValuesChange(nodeType: string, change: IUpdateInformation) {
		// No-op
		return;
	}

	private initRudderStack(key: string, proxy: string, options: IDataObject) {
		window.rudderanalytics = window.rudderanalytics || [];
		if (!this.rudderStack) {
			return;
		}

		this.rudderStack.methods = [
			'load',
			'page',
			'track',
			'identify',
			'alias',
			'group',
			'ready',
			'reset',
			'getAnonymousId',
			'setAnonymousId',
		];

		this.rudderStack.factory = (method: string) => {
			return (...args: unknown[]) => {
				if (!this.rudderStack) {
					throw new Error('RudderStack not initialized');
				}

				const argsCopy = [method, ...args];
				this.rudderStack.push(argsCopy);

				return this.rudderStack;
			};
		};

		for (const method of this.rudderStack.methods) {
			this.rudderStack[method] = this.rudderStack.factory(method);
		}

		this.rudderStack.loadJS = () => {
			const script = document.createElement('script');

			script.type = 'text/javascript';
			script.async = !0;
			script.src = 'https://cdn-rs.n8n.io/v1/ra.min.js';

			const element: Element = document.getElementsByTagName('script')[0];

			if (element && element.parentNode) {
				element.parentNode.insertBefore(script, element);
			}
		};

		this.rudderStack.loadJS();
		this.rudderStack.load(key, proxy, options);
	}
}

export const telemetry = new Telemetry();

export const TelemetryPlugin: Plugin = {
	install(app) {
		app.config.globalProperties.$telemetry = telemetry;
	},
};
