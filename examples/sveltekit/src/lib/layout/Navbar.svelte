<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChevronDown } from '@lucide/svelte';
	import logo from '$lib/assets/passlock-logo.svg';
	import logoDark from '$lib/assets/passlock-logo.dark.svg';

	let { user }: { user: { givenName: string } | null } = $props();
</script>

<div class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h8m-8 6h16" />
				</svg>
			</div>
			<ul
				tabindex="-1"
				class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				<li><a href={resolve('/login')}>Login</a></li>
				<li><a href={resolve('/login/autofill')}>Autofill login</a></li>
			</ul>
		</div>
		<a href={resolve('/')} class="mx-5">
			<picture>
				<source srcset={logoDark} media="(prefers-color-scheme: dark)" />
				<source srcset={logo} media="(prefers-color-scheme: light)" />
				<img src={logo} class="size-10" alt="Passlock logo" />
			</picture>
		</a>
	</div>
	<div class="navbar-end">
		{#if user}
			<div class="group dropdown dropdown-end mr-5">
				<div
					tabindex="0"
					role="button"
					class="btn flex items-center rounded-field btn-ghost group-hover:bg-base-200">
					{user.givenName}
					<ChevronDown class="size-4" />
				</div>
				<ul
					tabindex="-1"
					class="dropdown-content menu z-1 mt-1 w-52 rounded-box bg-base-200 p-2 shadow-sm group-hover:bg-base-200">
					<li><a href={resolve('/account')}>My Account</a></li>
					<li><a href={resolve('/passkeys')}>My Passkeys</a></li>
					<li><a href={resolve('/logout')}>Logout</a></li>
				</ul>
			</div>
		{:else}
			<a href={resolve('/login')} class="mr-5 link link-secondary">Login</a>
			<a href={resolve('/login/autofill')} class="mr-5 hidden link link-accent lg:block">
				Autofill login
			</a>
			<a href={resolve('/signup')} class="btn mr-5 text-white btn-primary">Sign up</a>
		{/if}
	</div>
</div>
