<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	/* can be ignored as superforms uses stores for dynamic state */
	// svelte-ignore state_referenced_locally
	const { form, errors } = superForm(data.form);
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="POST" class="rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Login</h2>

		<fieldset class="fieldset w-xs">
			<label for="username" class="label">Email</label>
			<input
				id="username"
				type="email"
				autocomplete="email"
				name="username"
				class={['input', { 'input-error': $errors.username }]}
				bind:value={$form.username}
				required />
			{#if $errors.username}<span class="text-error">{$errors.username}</span>{/if}

			<button class="btn mt-4 btn-primary">Continue</button>
		</fieldset>

		<p class="mt-4 text-center text-sm">
			Prefer passkeys?
			<a href={resolve('/passkeys/login')} class="ml-1 text-primary hover:underline">
				Login using your passkey
			</a>
		</p>
		<p class="mt-1 text-center text-sm">
			Not yet a member? <a href={resolve('/signup')} class="ml-1 text-primary hover:underline">
				Sign up
			</a>
		</p>
	</form>
</div>

<!-- TODO Delete me -->
<div class="absolute top-20 right-8 hidden w-96 bg-base-200 p-8 lg:block">
	<h2 class="text-center text-xl font-semibold">Developer notes</h2>
  <p class="mt-2">We adopt a two-step login flow:</p>
	<ol class="mt-2 list-inside list-decimal">
		<li class="mt-2">First we identify the user and check if they have a passkey.</li>
		<li class="mt-2">If they have a passkey we use it for authentication, otherwise we fallback to passwords.</li>
	</ol>
  <p class="mt-2">
    Check out the <a class="link link-primary" href={resolve("/login/autofill")}>Autofill</a> login page, which supports 
    progressive enhancement using a single-step login.
  </p>
</div>