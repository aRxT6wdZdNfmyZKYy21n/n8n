import type { Ref } from 'vue';
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@/composables/useStorage';
import { useUsersStore } from '@/features/settings/users/users.store';
import { useRootStore } from '@n8n/stores/useRootStore';
import { useSettingsStore } from '@/stores/settings.store';
import type { FeatureFlags, IDataObject } from 'n8n-workflow';
import { EXPERIMENTS_TO_TRACK, LOCAL_STORAGE_EXPERIMENT_OVERRIDES } from '@/constants';
import { useDebounce } from '@/composables/useDebounce';
import { useTelemetry } from '@/composables/useTelemetry';

const EVENTS = {
	IS_PART_OF_EXPERIMENT: 'User is part of experiment',
};

export type PosthogStore = ReturnType<typeof usePostHog>;

export const usePostHog = defineStore('posthog', () => {
	const usersStore = useUsersStore();
	const settingsStore = useSettingsStore();
	const telemetry = useTelemetry();
	const rootStore = useRootStore();
	const { debounce } = useDebounce();

	const featureFlags: Ref<FeatureFlags | null> = ref(null);
	const trackedDemoExp: Ref<FeatureFlags> = ref({});

	const overrides: Ref<Record<string, string | boolean>> = ref({});

	const reset = () => {
		// PostHog disabled for self-hosted version
		featureFlags.value = null;
		trackedDemoExp.value = {};
	};

	const getVariant = (experiment: keyof FeatureFlags): FeatureFlags[keyof FeatureFlags] => {
		return overrides.value[experiment] ?? featureFlags.value?.[experiment];
	};

	const isVariantEnabled = (experiment: string, variant: string) => {
		return getVariant(experiment) === variant;
	};

	/**
	 * Checks if the given feature flag is enabled. Should only be used for boolean flags
	 */
	const isFeatureEnabled = (experiment: keyof FeatureFlags) => {
		return getVariant(experiment) === true;
	};

	if (!window.featureFlags) {
		// for testing
		const cachedOverrides = useStorage(LOCAL_STORAGE_EXPERIMENT_OVERRIDES).value;
		if (cachedOverrides) {
			try {
				console.log('Overriding feature flags', cachedOverrides);
				const parsedOverrides = JSON.parse(cachedOverrides);
				if (typeof parsedOverrides === 'object') {
					overrides.value = JSON.parse(cachedOverrides);
				}
			} catch (e) {
				console.log('Could not override experiment', e);
			}
		}

		window.featureFlags = {
			// since features are evaluated serverside, regular posthog mechanism to override clientside does not work
			override: (name: string, value: string | boolean) => {
				overrides.value[name] = value;
				try {
					useStorage(LOCAL_STORAGE_EXPERIMENT_OVERRIDES).value = JSON.stringify(overrides.value);
				} catch (e) {}
			},

			getVariant,
			getAll: () => featureFlags.value ?? {},
		};
	}

	const identify = () => {
		// PostHog disabled for self-hosted version
		return;
	};

	const trackExperiment = (featFlags: FeatureFlags, name: string) => {
		const variant = featFlags[name];
		if (!variant || trackedDemoExp.value[name] === variant) {
			return;
		}

		telemetry.track(EVENTS.IS_PART_OF_EXPERIMENT, {
			name,
			variant,
		});

		trackedDemoExp.value[name] = variant;
	};

	const trackExperiments = (featFlags: FeatureFlags) => {
		EXPERIMENTS_TO_TRACK.forEach((name) => trackExperiment(featFlags, name));
	};
	const trackExperimentsDebounced = debounce(trackExperiments, {
		debounceTime: 2000,
	});

	const init = (evaluatedFeatureFlags?: FeatureFlags) => {
		// PostHog disabled for self-hosted version
		return;
	};

	const setMetadata = (metadata: IDataObject, target: 'user' | 'events') => {
		// PostHog disabled for self-hosted version
		return;
	};

	const capture = (event: string, properties: IDataObject) => {
		// PostHog disabled for self-hosted version
		return;
	};

	return {
		init,
		isFeatureEnabled,
		isVariantEnabled,
		getVariant,
		reset,
		identify,
		setMetadata,
		capture,
		overrides,
	};
});
