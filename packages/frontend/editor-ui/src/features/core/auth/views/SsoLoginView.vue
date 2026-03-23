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
			<div :class="$style.brand">
				<img src="/static/sbermobile.png" alt="СберМобайл" :class="$style.logo" />
			</div>
			<h2 :class="$style.title">{{ i18n.baseText('auth.signin') }}</h2>
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
	align-items: center;
	min-height: 100vh;
	padding: var(--spacing--2xl) var(--spacing--m);
	background: linear-gradient(180deg, #fff8f3 0%, #fff 100%);
}

.card {
	width: 420px;
	max-width: 100%;
	padding: var(--spacing--xl);
	border: 1px solid #ffd6bf;
	border-radius: var(--radius--lg);
	background: var(--color--background);
	box-shadow: 0 10px 30px rgba(247, 112, 24, 0.08);
}

.brand {
	display: flex;
	justify-content: center;
	margin-bottom: var(--spacing--m);
}

.logo {
	max-width: 210px;
	width: 100%;
	height: auto;
}

.title {
	margin: 0 0 var(--spacing--m) 0;
	text-align: center;
}

.form {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--s);
}

.form input {
	border: 1px solid #ffd6bf;
	border-radius: var(--radius--md);
	padding: var(--spacing--xs) var(--spacing--s);
}

.form input:focus {
	outline: none;
	border-color: #f77018;
	box-shadow: 0 0 0 3px rgba(247, 112, 24, 0.16);
}

.form button {
	background: #f77018;
	border: none;
	color: #fff;
	border-radius: var(--radius--md);
	padding: var(--spacing--xs) var(--spacing--s);
	font-weight: var(--font-weight-bold);
}

.form button:hover:not(:disabled) {
	background: #e26511;
}

.form button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.error {
	margin-top: var(--spacing--s);
	text-align: center;
	color: var(--color--danger);
}
</style>
