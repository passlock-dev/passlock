<!--
  @component
  Displays the user's Gravatar, falling back to their initials
-->
<script lang="ts">
  import type { User } from 'lucia'
  import { createAvatar, createDropdownMenu, melt } from '@melt-ui/svelte'

  export let user: User

  let form: HTMLFormElement

  const {
    elements: { menu, item, trigger },
    states: { open }
  } = createDropdownMenu()

  const {
    elements: { image, fallback }
  } = createAvatar({
    src: user.avatar
  })
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
    class="text-lg font-medium text-base-700 uppercase">
    {user.initials}
  </span>
</button>

<div
  use:melt={$menu}
  class="mt-4 w-40 shadow-md rounded-lg p-2 space-y-1 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 dark:divide-gray-700">
  <button
    use:melt={$item}
    on:click={() => form.requestSubmit()}
    type="button"
    class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-200 dark:hover:bg-gray-700">
    Logout
  </button>
</div>

<form bind:this={form} method="post" action="/logout">

</form>