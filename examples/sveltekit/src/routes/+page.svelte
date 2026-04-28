<script lang="ts">
	import { resolve } from '$app/paths';
	import svelteLogo from '$lib/assets/svelte-logo.svg';
	import Mail from '@lucide/svelte/icons/mail';
	import Database from '@lucide/svelte/icons/database';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import PasskeyIcon from '$lib/components/PasskeyIcon.svelte';

	const features = [
		{
			icon: Smartphone,
			title: 'Local device updates',
			description: "Update passkeys on a user's device to reflect account username/email changes"
		},
		{
			icon: Trash2,
			title: 'Local passkey deletion',
			description:
				"Prevent orphaned passkeys by deleting stale passkeys from the user's passkey manager"
		},
		{
			icon: Database,
			title: 'Session management',
			description: 'Lucia style sessions offer power and flexibility, with no framework lock-in'
		},
		{
			icon: Mail,
			title: 'One time codes',
			description: 'Email based one time codes for mailbox verification and account recovery'
		}
	];
</script>

<svelte:head>
	<title>SvelteKit + Passlock Sample App</title>
</svelte:head>

<div
	class="mx-auto flex h-full w-full flex-col gap-10 p-6 lg:-mt-10 lg:flex-row lg:items-center lg:px-12 lg:pt-0">
	<div class="flex flex-col justify-center gap-5 lg:basis-1/2">
		<div
			class="flex w-fit items-center gap-2 rounded-xl border border-neutral/10 bg-base-300 px-2 py-1">
			<img src={svelteLogo} class="size-5" alt="Svelte logo" />

			<span class="font-mono text-gray-700 dark:text-gray-50">SvelteKit</span>
			+
			<span class="font-mono text-primary">Passlock</span>
		</div>
		<div>
			<h1 class="text-4xl font-semibold lg:text-5xl">Advanced SvelteKit authentication</h1>
		</div>
		<div>
			<p class="text-lg leading-relaxed">
				Sample SvelteKit app illustrating how to support passkey authentication alongside email
				one-time-codes. Includes advanced features including rate limiting, account recovery, local
				credential management and more..
			</p>
		</div>
		<div class="flex items-center gap-6">
			<a href={resolve('/signup')} class="btn btn-wide text-white btn-primary">Sign up</a>
			<a href={resolve('/login')} class="link link-secondary">Login</a>
		</div>
	</div>
	<div class="lg:basis-1/2">
		<div class="rounded-box border border-base-300 bg-base-200/30 p-4 shadow-lg sm:p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Powerful features</h2>
				<span class="badge badge-outline badge-lg">Highlights</span>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<article class="card col-span-2 border border-base-300/80 bg-base-100 shadow-sm">
					<div class="card-body gap-2 p-3">
						<h3 class="card-title text-secondary">
							<PasskeyIcon class="size-7 text-secondary" />
							Advanced passkeys
						</h3>
						<p class="text-sm leading-6 text-base-content/75">
							Passkey registration, authentication and management. Plus support for multiple
							authentication flows
						</p>
					</div>
				</article>

				{#each features as feature (feature.title)}
					<article class="card border border-base-300/80 bg-base-100 shadow-sm">
						<div class="card-body gap-2 p-3">
							<h3 class="card-title text-primary">
								{#if feature.icon}
									<svelte:component this={feature.icon} />
								{/if}
								{feature.title}
							</h3>
							<p class="text-sm leading-6 text-base-content/75">{feature.description}</p>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>
</div>
