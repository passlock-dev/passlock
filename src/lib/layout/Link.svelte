<script lang="ts">
  export let href = '#'
</script>

<a
  {href}
  class="text-blue-600 dark:text-blue-500 decoration-2 hover:underline font-medium {$$restProps.class}">
  <slot />
</a>
