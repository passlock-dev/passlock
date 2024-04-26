<!--
  @component
  Displays the user's Gravatar, falling back to their initials
-->
<script lang="ts">
  import type { User } from 'lucia'
  import { createAvatar, melt } from '@melt-ui/svelte'

  export let user: User

  const {
    elements: { image, fallback }
  } = createAvatar({
    src: user.avatar
  })
</script>

<div
  class="flex size-10 items-center justify-center rounded-full bg-gray-100">
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
</div>
