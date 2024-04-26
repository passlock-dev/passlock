<!--
  @component
  Burger/X button to toggle the mobile dropdown menu
-->
<script lang="ts">
  export let visible = false

  const toggleMobileMenu = () => {
    visible = !visible
  }
</script>

<button
  on:click={toggleMobileMenu}
  type="button"
  class="size-10 relative focus:outline-none bg-blue-600 rounded"
  aria-controls="navbar-primary"
  aria-label="Toggle navigation">
  <div
    class="block w-5 absolute left-5 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
    <span
      class="block absolute h-0.5 w-5 text-white bg-current transform transition duration-500 ease-in-out {visible
        ? 'rotate-45'
        : '-translate-y-1.5'}">
    </span>
    <span
      class="block absolute h-0.5 w-5 text-white bg-current transform transition duration-500 ease-in-out {visible
        ? 'opacity-0'
        : ''}">
    </span>
    <span
      class="block absolute h-0.5 w-5 text-white bg-current transform transition duration-500 ease-in-out {visible
        ? '-rotate-45'
        : 'translate-y-1.5'}">
    </span>
  </div>
</button>
