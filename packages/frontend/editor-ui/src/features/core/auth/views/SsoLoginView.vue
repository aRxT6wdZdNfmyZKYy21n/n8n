<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const login = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const ruText = {
	title: 'Вход',
	loginPlaceholder: 'Логин или email',
	passwordPlaceholder: 'Пароль',
	submit: 'Войти',
	submitLoading: 'Вход...',
	defaultError: 'Ошибка входа',
};

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
		error.value = data.message ?? ruText.defaultError;
	} catch {
		error.value = ruText.defaultError;
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
			<h2 :class="$style.title">{{ ruText.title }}</h2>
			<form :class="$style.form" @submit.prevent="onSubmit">
				<input
					v-model="login"
					type="text"
					:placeholder="ruText.loginPlaceholder"
					autocomplete="username"
					required
				/>
				<input
					v-model="password"
					type="password"
					:placeholder="ruText.passwordPlaceholder"
					autocomplete="current-password"
					required
				/>
				<button type="submit" :disabled="loading">
					{{ loading ? ruText.submitLoading : ruText.submit }}
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
	padding: var(--spacing--2xl) var(--spacing--xl);
	border: 1px solid #ffd6bf;
	border-radius: var(--radius--lg);
	background: var(--color--background);
	box-shadow: 0 10px 30px rgba(247, 112, 24, 0.08);
	display: flex;
	flex-direction: column;
	gap: var(--spacing--m);
}

.brand {
	display: flex;
	justify-content: center;
	margin-bottom: var(--spacing--s);
}

.logo {
	max-width: 320px;
	width: 100%;
	height: auto;
}

.title {
	margin: 0;
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
	margin-top: var(--spacing--xs);
	text-align: center;
	color: var(--color--danger);
}
</style>
