<script lang="ts">
  import {
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'

  import Google from '$lib/icons/Google.svelte'
  import Base from './Base.svelte'

  export let operation: 'register' | 'login' = 'login'

  $: message = options.operation === 'register' ? 'Sign up with Google' : 'Sign in with Google'

  $: options = {
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT,
    operation: operation,
    oneTap: false
  }
</script>

<Base {options} let:click on:principal>
  <button
    type="button"
    on:click={click}
    class="
      w-full
      py-3 px-4
      inline-flex
      justify-center
      items-center
      gap-x-2
      text-sm
      font-medium
      rounded-lg
      border
      border-gray-200
      bg-white
      text-gray-800
      shadow-sm
      hover:bg-gray-50
      disabled:opacity-50
      disabled:pointer-events-none
      dark:bg-slate-900
      dark:border-gray-700
      dark:text-white
      dark:hover:bg-gray-800">
    <Google />
    {message}
  </button>

  <div slot="error" let:error class="mt-2 text-sm text-center text-red-600 dark:text-red-400">
    {error}
  </div>
</Base>
