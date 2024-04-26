<script lang="ts">
  import type { User } from 'lucia'
  import { createDropdownMenu, createAvatar, melt } from '@melt-ui/svelte'

  export let user: User

  const {
    elements: { menu, item, trigger },
    states: { open }
  } = createDropdownMenu()

  const {
    elements: { image, fallback }
  } = createAvatar({
    src: user.avatar
  })

  let logoutForm: HTMLFormElement
</script>

<button
  use:melt={$trigger}
  class="flex size-8 items-center justify-center rounded-full bg-gray-100">
  <img
    use:melt={$image}
    class="h-full w-full rounded-[inherit]"
    src={user.avatar}
    alt="Gravatar for {user.givenName} {user.familyName}" />
  <span
    use:melt={$fallback}
    class="text-lg font-medium text-gray-700 uppercase">
    {user.initials}
  </span>
</button>

{#if $open}
  <div
    use:melt={$menu}
    class="mt-2 w-40 shadow-md rounded-lg p-2 space-y-1 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 dark:divide-gray-700">
    <button
      use:melt={$item}
      on:m-click={() => logoutForm.requestSubmit()}
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Logout
    </button>
  </div>
{/if}

<form class="hidden" bind:this={logoutForm} method="post" action="/logout">
  <button type="submit" class="font-medium text-slate-800 dark:text-slate-200">
    Logout
  </button>
</form>
