<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import ResendChallengeButton from '$lib/components/ResendChallengeButton.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import Link from '$lib/components/Link.svelte';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const superform = superForm(data.verifyForm, {
		applyAction: true,
		invalidateAll: 'pessimistic'
	});

	const { enhance, delayed } = superform;
</script>

<svelte:head>
	<title>Verify Login Code</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<div class="w-full max-w-sm rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Check your email</h2>
		<p class="mt-3 text-center text-sm text-base-content/80">
			We sent a 6-digit login code to <span class="font-semibold">{data.email}</span>
			.
		</p>
		<p class="mt-2 text-center text-sm text-base-content/80">Codes remain valid for 10 minutes.</p>

		<form method="post" action="?/verify" use:enhance class="mt-6">
			<fieldset class="fieldset">
				<TextInput
					{superform}
					field="code"
					label="One-time code"
					autocomplete="one-time-code"
					class="text-center font-mono text-lg tracking-[0.8em]" />

				<SubmitButton loading={$delayed} disabled={false}>Verify code</SubmitButton>
			</fieldset>
		</form>

		<ResendChallengeButton url={resolve('/login/email/verify-code/resend')} />

		<p class="mt-4 text-center text-sm">
			Need to start over?
			<Link href={resolve('/login')} class="ml-1">Back to login</Link>
		</p>
	</div>
</div>

<DevNotes>
	<p>This sample app doesn't actually send emails.</p>
	<p class="mt-2">You'll need to plug your own email sending mechanism into:</p>
	<p class="mt-2">
		<span class="font-mono">src/lib/server/email.ts</span>
	</p>
	<p class="mt-2">
		In the meantime <span class="font-semibold">check the dev server logs</span>
		where we have logged the code to the console.
	</p>
	<p class="mt-2 font-semibold text-error">Be sure to remove this before going into production!</p>
</DevNotes>
