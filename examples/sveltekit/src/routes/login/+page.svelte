<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import ChallengeRateLimitNotice from '#lib/components/ChallengeRateLimitNotice.svelte';
	import DevNotes from '#lib/components/DevNotes.svelte';
	import EmailInput from '#lib/components/EmailInput.svelte';
	import SubmitButton from '#lib/components/SubmitButton.svelte';
	import Link from '#lib/components/Link.svelte';
	import FormErrors from '#lib/components/FormErrors.svelte';

	let { data }: PageProps = $props();

	let rateLimitActive = $state(false);

	/* can be ignored as superforms uses stores for dynamic state */
	// svelte-ignore state_referenced_locally
	const superform = superForm(data.form);
	const { enhance, delayed, message } = superform;
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="post" use:enhance class="rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Login</h2>

		{#if $message?.type === 'notice'}
			<p class="mt-3 max-w-xs text-center text-sm text-error">{$message.text}</p>
		{:else if $message?.type === 'rateLimited'}
			<ChallengeRateLimitNotice
				rateLimit={$message.rateLimit}
				onActiveChange={(isActive) => {
					rateLimitActive = isActive;
				}}
				class="mt-3 max-w-xs text-center text-sm" />
		{/if}

		<FormErrors {superform} />

		<fieldset class="mt-3 fieldset w-xs">
			<EmailInput {superform} field="email" label="Account email" autocomplete="email" required />

			<SubmitButton loading={$delayed} disabled={rateLimitActive}>Continue</SubmitButton>
		</fieldset>

		<p class="mt-4 text-center text-sm">
			Prefer passkeys?
			<Link href={resolve('login/passkey')} class="ml-1">Login using your passkey</Link>
		</p>
		<p class="mt-1 text-center text-sm">
			Not yet a member?
			<Link href={resolve('signup')} class="ml-1">Sign up</Link>
		</p>
	</form>
</div>

<DevNotes>
	<p>We adopt a two-step login flow:</p>
	<ol class="mt-2 list-inside list-decimal">
		<li class="mt-2">First we lookup the claimed user id and check if a passkey is associated with the account.</li>
		<li class="mt-2">
			If a passkey is registered we use it for authentication, otherwise we email a single-use code.
		</li>
	</ol>
	<p class="mt-2">
		<span class="font-semibold">tip:</span> Check out the

		<a class="link link-primary" href={resolve('login/autofill')}>Autofill</a>

		login page, which supports progressive enhancement.
	</p>
</DevNotes>
