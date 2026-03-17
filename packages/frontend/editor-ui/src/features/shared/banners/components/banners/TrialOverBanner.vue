<script lang="ts" setup>
import BaseBanner from './BaseBanner.vue';
import { usePageRedirectionHelper } from '@/app/composables/usePageRedirectionHelper';
import { i18n as locale } from '@n8n/i18n';

import { N8nButton } from '@n8n/design-system';

const pageRedirectionHelper = usePageRedirectionHelper();

function onUpgradePlanClick() {
	void pageRedirectionHelper.goToUpgrade('canvas-nav', 'upgrade-canvas-nav', 'redirect');
}
</script>

<template>
	<!-- In self-hosted fork we hide “trial over” cloud banner -->
	<div />
</template>
