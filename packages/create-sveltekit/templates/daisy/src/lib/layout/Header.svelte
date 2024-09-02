<script lang="ts">
  import type { User } from 'lucia'
  import { logoutAction, todos } from '$lib/routes'
  import ThemeSelector from './ThemeSelector.svelte'

  export let user: User | null

  let logoutForm: HTMLFormElement

  const logout = () => {
    logoutForm.requestSubmit()
  }
</script>

<form bind:this={logoutForm} method="POST" action={logoutAction} class="hidden">
  <button type="submit">Logout</button>
</form>

<div class="navbar bg-base-100">
  <div class="flex-1">
    <a href="/" class="btn btn-ghost text-xl">Acme Inc.</a>
  </div>
  <div class="flex-none">
    {#if user}
      <ul class="menu menu-horizontal px-1">
        <li>
          <a href={todos}>My TODOs</a>
        </li>
      </ul>
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img alt="{user.givenName} {user.familyName}" src={user.avatar} />
          </div>
        </div>
        <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
          <li>
            <a on:click={logout}>Logout</a>
          </li>
        </ul>
      </div>
    {:else}
      <ThemeSelector />

      <ul class="menu menu-horizontal px-1">
        <li>
          <a href="/">Sign up</a>
        </li>
        <li>
          <a href="/login">Login</a>
        </li>
      </ul>
    {/if}
  </div>
</div>
