<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		href,
		children,
		class: clazz,
		...rest
	}: Omit<HTMLAnchorAttributes, 'href'> & { href: ResolvedPathname } = $props();
</script>

<!-- href is actually a ResolvedPathname but the linter isnt smart enough to see this -->
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a {href} class={[clazz, 'text-primary', 'hover:underline']} {...rest}>
	{@render children?.()}
</a>
