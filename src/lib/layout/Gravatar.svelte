<script lang="ts">
  import type { User } from "lucia";

  export let user: User
</script>

<img class="size-8 rounded-full" src={user.gravatarUrl} alt="Gravatar for {user.givenName} {user.familyName}" />
<form method="post" action="/logout">
  <button type="submit" class="font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Logout</button>
</form>