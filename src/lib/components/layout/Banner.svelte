<script lang="ts">
  let visible = true
</script>

{#if visible}
  <div class="bg-primary-600">
    <div class="px-4 py-4 mx-auto">
      <div class="flex justify-between">
        <div>&nbsp;</div>

        <p class="text-white">
          <span class="font-bold">Demo app</span>
          - Please try registration, email verification & login
        </p>

        <!-- <div class="ps-3 ms-auto"> -->
        <button
          on:click={() => (visible = false)}
          type="button"
          class="inline-flex rounded-lg p-1.5 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white"
          data-hs-remove-element="#ab-full-width-with-dismiss-button-on-blue-bg">
          <span class="sr-only">Dismiss</span>
          <svg
            class="flex-shrink-0 size-4"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <!-- </div> -->
      </div>
    </div>
  </div>
{/if}
