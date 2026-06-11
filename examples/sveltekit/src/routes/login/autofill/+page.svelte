<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';

	import { authenticatePasskey } from '$lib/client/passkeys';
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import EmailInput from '$lib/components/EmailInput.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import Link from '$lib/components/Link.svelte';

	let { data }: PageProps = $props();
	let disabled = $state(false);

	/* can be ignored as superforms uses stores for dynamic state */
	// svelte-ignore state_referenced_locally
	const superform = superForm(data.form);
	const { enhance, delayed } = superform;

	onMount(async () => {
		if (!data.preparedAuthentication) {
			if (data.prepareError) console.log(data.prepareError);
			return;
		}

		const config = {
			tenancyId: data.tenancyId,
			rpId: data.rpId,
			endpoint: data.endpoint
		};

		// Autofill-capable browsers can surface a passkey picker as soon as the
		// page mounts, avoiding the usual explicit "continue" click.
		const result = await authenticatePasskey(
			{
				authenticationToken: data.preparedAuthentication.authenticationToken,
				onEvent: (event) => {
					// Once the user picks a passkey, freeze the fallback form to avoid
					// competing submissions during server verification.
					if (event === 'verifyCredential') {
						disabled = true;
					}
				}
			},
			config
		);

		if (result._tag === 'PasslockLoginSuccess') {
			// Refresh the root layout so navigation and account UI pick up the new
			// authenticated state.
			await invalidateAll();
			await goto(resolve('/'));
			disabled = false;
		} else {
			console.log(result.message);
			disabled = false;
		}
	});
</script>

<svelte:head>
	<title>Autofill Login</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="post" use:enhance class="rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Login</h2>

		<fieldset class="mt-3 fieldset w-xs">
			<EmailInput
				{superform}
				field="email"
				label="Account email"
				autocomplete="email webauthn"
				required
				{disabled} />
			<SubmitButton loading={$delayed} {disabled}>Continue</SubmitButton>
		</fieldset>

		<p class="mt-4 text-center text-sm">
			Not yet a member?
			<Link href={resolve('/signup')} class="ml-1">Sign up</Link>
		</p>
	</form>
</div>

<DevNotes>
	<p>
		Uses passkey autofill. Essentially allows users with passkeys to login in a single step vs the
		usual
		<a href={resolve('/login')} class="link link-secondary">two step login</a>
		flow.
	</p>

	<p class="mt-2">
		This is most suitable if you're users are tech-savvy. Many users will be confused by this flow
		as they see a username/email field but when they interact with it, they're asked to sign in with
		a passkey.
	</p>

	<p class="mt-2">Browser support is also a little flaky.</p>

	<p class="mt-2">
		The backend prepares a discoverable authentication token with conditional mediation before the
		browser starts autofill. The browser receives only the token.
	</p>
</DevNotes>
