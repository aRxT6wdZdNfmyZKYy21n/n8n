<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from '@n8n/i18n';

const route = useRoute();
const i18n = useI18n();

const login = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
	error.value = '';
	loading.value = true;
	try {
		const redirect = typeof route.query.redirect === 'string' ? decodeURIComponent(route.query.redirect) : '/';
		const response = await fetch('/sso/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				login: login.value,
				password: password.value,
				redirect,
			}),
		});
		const data = (await response.json()) as { status?: string; message?: string; redirectUrl?: string };
		if (data.status === 'ok' && data.redirectUrl) {
			window.location.href = data.redirectUrl;
			return;
		}
		error.value = data.message ?? i18n.baseText('auth.signin.error');
	} catch {
		error.value = i18n.baseText('auth.signin.error');
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div :class="$style.container">
		<div :class="$style.card">
			<h2 :class="$style.title">{{ i18n.baseText('auth.signin') }}</h2>
			<p :class="$style.subtitle">Use your corporate account</p>
			<form :class="$style.form" @submit.prevent="onSubmit">
				<input
					v-model="login"
					type="text"
					placeholder="Login or email"
					autocomplete="username"
					required
				/>
				<input
					v-model="password"
					type="password"
					placeholder="Password"
					autocomplete="current-password"
					required
				/>
				<button type="submit" :disabled="loading">
					{{ loading ? i18n.baseText('generic.waiting') : i18n.baseText('auth.signin') }}
				</button>
			</form>
			<p v-if="error" :class="$style.error">{{ error }}</p>
		</div>
	</div>
</template>

<style module lang="scss">
.container {
	display: flex;
	justify-content: center;
	padding-top: var(--spacing--2xl);
}

.card {
	width: 420px;
	padding: var(--spacing--lg);
	border: var(--border);
	border-radius: var(--radius--lg);
	background: var(--color--background);
}

.title {
	margin: 0 0 var(--spacing--xs) 0;
}

.subtitle {
	margin: 0 0 var(--spacing--sm) 0;
	color: var(--color--text--tint-1);
}

.form {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--xs);
}

.error {
	margin-top: var(--spacing--xs);
	color: var(--color--danger);
}
</style>
