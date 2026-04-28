<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import Navbar from '$lib/layout/Navbar.svelte';
	import Footer from '$lib/layout/Footer.svelte';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- TODO remove for production -->
	<meta name="robots" content="noindex, nofollow" />
	<meta name="version" content={data.version} />
</svelte:head>

<div class="flex h-full flex-col">
	<Navbar user={data.user} />

	<main class="flex-1">
		{@render children()}
	</main>

	<Footer />
</div>
