<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/* can be ignored as superforms uses stores for dynamic state */
	// svelte-ignore state_referenced_locally
	const { form, errors } = superForm(data.form);
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

		<form method="post" class="w-full max-w-md">
			<fieldset class="fieldset rounded-box border border-base-300 bg-base-200 p-10">
				{#if data.notice}
					<p class="mb-4 text-sm text-error max-w-sm">{data.notice}</p>
				{/if}

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label for="givenName" class="label">First name</label>
						<input
							id="givenName"
							type="text"
							autocomplete="given-name"
							name="givenName"
							class={['input mt-2 w-full', { 'input-error': $errors.givenName }]}
							bind:value={$form.givenName}
							required />
						{#if $errors.givenName}
							{#each $errors.givenName as error (error)}
								<span class="text-error">{error}</span>
							{/each}
						{/if}
					</div>

					<div>
						<label for="familyName" class="label">Last name</label>
						<input
							id="familyName"
							type="text"
							autocomplete="family-name"
							name="familyName"
							class={['input mt-2 w-full', { 'input-error': $errors.familyName }]}
							bind:value={$form.familyName}
							required />
						{#if $errors.familyName}
							{#each $errors.familyName as error (error)}
								<span class="text-error">{error}</span>
							{/each}
						{/if}
					</div>
				</div>

				<label for="email" class="label mt-2">Email</label>
				<input
					id="email"
					type="email"
					name="email"
					autocomplete="email"
					class={['input w-full', { 'input-error': $errors.email }]}
					bind:value={$form.email}
					required />
				{#if $errors.email}<span class="text-error">{$errors.email}</span>{/if}

				<button class="btn mt-4 btn-primary">Send sign up code</button>

				<p class="mt-4 text-center text-sm">
					Already have an account?
					<a href="/login" class="ml-1 text-primary hover:underline">Login</a>
				</p>
			</fieldset>
		</form>
	</div>
</div>
