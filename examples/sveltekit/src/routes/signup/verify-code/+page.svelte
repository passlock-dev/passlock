<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import DevNotes from '$lib/components/DevNotes.svelte';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const {
		form: verifyForm,
		errors: verifyErrors,
		enhance: verifyEnhance,
		constraints: verifyConstraints
	} = superForm(data.verifyForm, {
		applyAction: true,
		invalidateAll: 'pessimistic'
	});

	// svelte-ignore state_referenced_locally
	const {
		form: resendForm,
		message: resendMessage,
		enhance: resendEnhance
	} = superForm(data.resendForm, {
		applyAction: true,
		invalidateAll: 'pessimistic'
	});
</script>

<svelte:head>
	<title>Verify Sign Up Code</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<div class="w-full max-w-sm rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Confirm your email</h2>
		<p class="mt-3 text-center text-sm text-base-content/80">
			We sent a 6-digit sign up code to <span class="font-semibold">{data.email}</span>.
		</p>
		<p class="mt-2 text-center text-sm text-base-content/80">Codes stay valid for 10 minutes.</p>

		<form method="POST" action="?/verify" use:verifyEnhance class="mt-6">
			<fieldset class="fieldset">
				<label for="code" class="label">One-time code</label>
				<input
					id="code"
					type="text"
					name="code"
					autocomplete="one-time-code"
					class={['input tracking-[0.3em]', { 'input-error': $verifyErrors.code }]}
					bind:value={$verifyForm.code}
					{...$verifyConstraints.code} />

				{#if $verifyErrors.code}
					{#each $verifyErrors.code as error (error)}
						<span class="text-error">{error}</span>
					{/each}
				{/if}

				<button class="btn mt-4 btn-primary">Verify code</button>
			</fieldset>
		</form>

		{#if $resendMessage}
			<p class="mt-4 text-center text-sm text-success">{$resendMessage}</p>
		{/if}

		<form method="POST" action="?/resend" use:resendEnhance class="mt-4">
			<input type="hidden" name="intent" bind:value={$resendForm.intent} />
			<button class="btn w-full btn-outline">Send a new code</button>
		</form>

		<p class="mt-4 text-center text-sm">
			Need to start over?
			<a href={resolve('/signup')} class="ml-1 text-primary hover:underline">Back to sign up</a>
		</p>
	</div>
</div>

<DevNotes>
  <p>
    This sample app doesn't actually send emails. 
  </p>
  <p class="mt-2">
    You'll need to plug your own email sending mechanism into: 
  </p>
  <p class="mt-2">
    <span class="font-mono">src/lib/server/email.ts</span>
  </p>
  <p class="mt-2">
    In the meantime <span class="font-semibold">check the dev server logs</span>, 
    where we have logged the code to the console.
  </p>
  <p class="mt-2 font-semibold text-error">
    Be sure to remove this before going into production!
  </p>
</DevNotes>
