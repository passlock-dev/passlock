<script lang="ts">
	import { resolve } from '$app/paths';
	import svelteLogo from '$lib/assets/svelte-logo.svg';
	import { Chromium, RectangleEllipsis, Database, Trash2, Smartphone, List } from '@lucide/svelte';

	const headlineFeature = {
		icon: RectangleEllipsis,
		title: 'Progressive enhancement',
		description: 'Supports passkeys alongside existing/legacy password based authentication.'
	};

	const features = [
		{
			icon: Database,
			title: 'Session management',
			description: 'Lucia sessions deliver great power & flexibility, with no framework lock-in.'
		},
		{
			icon: Chromium,
			title: 'Passkey platform data',
			description:
				'Informs the user which platform a passkey belongs to e.g. Apple or Google Chrome.'
		},
		{
			icon: Smartphone,
			title: 'Local passkey updates',
			description: 'Updates the passkey account name on the users local device/password manager.'
		},
		{
			icon: Trash2,
			title: 'Local passkey deletion',
			description: "Prevents orphaned passkeys by deleting passkeys on the user's device."
		}
	];

	const otherFeatures = [
		{
			icon: RectangleEllipsis,
			title: 'Passkey autofill',
			description:
				'One click login for passkey users, falling back to username/password for others.'
		},
		{
			icon: List,
			title: 'Pre-selected passkeys',
			description: 'Two step passkey login flow pre-selects suitable passkeys for the user.'
		}
	];
</script>

<svelte:head>
  <title>SvelteKit + Passlock Sample App</title>
</svelte:head>

<div class="mx-auto flex w-full flex-col gap-10 px-6 lg:flex-row lg:items-center lg:px-12 lg:pt-20">
	<div class="flex flex-col justify-center gap-5 lg:basis-1/2">
		<div
			class="flex w-fit items-center gap-2 rounded-xl border border-neutral/10 bg-base-300 px-2 py-1">
			<img src={svelteLogo} class="size-5" alt="Svelte logo" />

			<span class="font-mono text-gray-700 dark:text-gray-50">SvelteKit</span>
			+
			<span class="font-mono text-primary">Passlock</span>
		</div>
		<div>
			<h1 class="text-4xl font-semibold lg:text-5xl">Sample passkey app</h1>
		</div>
		<div>
			<p class="text-lg leading-relaxed">
				Sample SvelteKit app illustrating how to support passkey authentication alongside password
				based authentication. Includes advanced features including autofill, local passkey updates,
				deletion and more.
			</p>
		</div>
		<div class="flex items-center gap-6">
			<a href={resolve('/signup')} class="btn btn-wide btn-primary text-white">Sign up</a>
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
							<svelte:component this={headlineFeature.icon} />
							{headlineFeature.title}
						</h3>
						<p class="text-sm leading-6 text-base-content/75">{headlineFeature.description}</p>
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

				{#each otherFeatures as feature (feature.title)}
					<article class="card border border-base-300/80 bg-base-100 shadow-sm">
						<div class="card-body gap-2 p-3">
							<h3 class="card-title text-gray-700 dark:text-gray-200">
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
