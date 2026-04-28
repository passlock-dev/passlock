<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import ChallengeRateLimitNotice from '$lib/components/ChallengeRateLimitNotice.svelte';
	import EmailInput from '$lib/components/EmailInput.svelte';
	import FormErrors from '$lib/components/FormErrors.svelte';
	import Link from '$lib/components/Link.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';

	let { data }: PageProps = $props();

	let rateLimitActive = $state(false);

	/* can be ignored as superforms uses stores for dynamic state */
	// svelte-ignore state_referenced_locally
	const superform = superForm(data.form);
	const { enhance, delayed, message } = superform;
</script>

<svelte:head>
	<title>Create an account</title>
</svelte:head>

<div class="mx-auto flex h-full max-w-5xl items-center justify-center">
	<div class="flex flex-col items-center lg:flex-row lg:gap-8">
		<div class="px-2 text-center lg:text-left">
			<h1 class="text-5xl font-bold">Create your account</h1>
			<p class="py-6">
				Enter your details and we’ll send a one-time code to verify your email before creating the
				account.
			</p>
		</div>

		<form method="post" use:enhance class="w-full max-w-md">
			<fieldset class="fieldset rounded-box border border-base-300 bg-base-200 p-10">
				{#if $message?.type === 'notice'}
					<p class="mb-4 max-w-sm text-sm text-error">{$message.text}</p>
				{:else if $message?.type === 'rateLimited'}
					<ChallengeRateLimitNotice
						rateLimit={$message.rateLimit}
						onActiveChange={(isActive) => {
							rateLimitActive = isActive;
						}}
						class="mb-4 max-w-sm text-sm" />
				{/if}

				<FormErrors {superform} />

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<TextInput
							{superform}
							field="givenName"
							label="First name"
							autocomplete="given-name"
							class="mt-2 w-full"
							required />
					</div>

					<div>
						<TextInput
							{superform}
							field="familyName"
							label="Last name"
							autocomplete="family-name"
							class="mt-2 w-full"
							required />
					</div>
				</div>

				<EmailInput
					{superform}
					field="email"
					label="Email"
					autocomplete="email"
					class="mt-2 w-full"
					required />

				<SubmitButton disabled={rateLimitActive} loading={$delayed}>Send sign up code</SubmitButton>

				<p class="mt-4 text-center text-sm">
					Already have an account?
					<Link href={resolve('/login')} class="ml-1">Login</Link>
				</p>
			</fieldset>
		</form>
	</div>
</div>
