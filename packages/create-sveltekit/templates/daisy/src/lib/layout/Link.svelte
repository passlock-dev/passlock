<script lang="ts">
  export let href = '#'
</script>

<a {href} class="link {$$restProps.class}">
  <slot />
</a>
