import { useUsersStore } from '@/features/settings/users/users.store';
import { useCloudPlanStore } from '@/app/stores/cloudPlan.store';
import { useVersionsStore } from '@/app/stores/versions.store';
import { useTelemetry } from './useTelemetry';
import { useSettingsStore } from '@/app/stores/settings.store';
import type { CloudUpdateLinkSourceType, UTMCampaign } from '@/Interface';
import { N8N_PRICING_PAGE_URL } from '@/app/constants';
import { confirmIfBuilderStreaming } from '@/features/ai/assistant/composables/useBuilderStreamingGuard';

export function usePageRedirectionHelper() {
	const usersStore = useUsersStore();
	const cloudPlanStore = useCloudPlanStore();
	const versionsStore = useVersionsStore();
	const telemetry = useTelemetry();
	const settingsStore = useSettingsStore();

	/**
	 * If the user is an instance owner in the cloud, it generates an auto-login link to the
	 * cloud dashboard that redirects the user to the /manage page where they can upgrade to a new n8n version.
	 * Otherwise, it redirect them to our docs.
	 */
	const goToVersions = async () => {
		// In this self-hosted fork we always use the local infoUrl
		// and never redirect to the n8n cloud dashboard.
		location.href = versionsStore.infoUrl;
	};

	const goToDashboard = async () => {
		// No-op for self-hosted: there is no cloud dashboard to open.
		return;
	};

	/**
	 * If the user is an instance owner in the cloud, it generates an auto-login link to the
	 * cloud dashboard that redirects the user to the /account/change-plan page where they upgrade/downgrade the current plan.
	 * Otherwise, it redirect them our website.
	 */

	const goToUpgrade = async (
		source: CloudUpdateLinkSourceType,
		utm_campaign: UTMCampaign,
		mode: 'open' | 'redirect' = 'open',
	) => {
		// In this fork, upgrade CTAs do nothing:
		// - no telemetry tracking
		// - no redirects to pricing page or cloud dashboard
		void source;
		void utm_campaign;
		void mode;
		return;
	};

	const generateUpgradeLink = async (source: string, utm_campaign: string) => {
		// Kept for API compatibility; never used in this fork.
		void source;
		void utm_campaign;
		return N8N_PRICING_PAGE_URL;
	};

	return {
		goToDashboard,
		goToVersions,
		goToUpgrade,
	};
}
