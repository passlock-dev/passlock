<script lang="ts" generics="T extends Record<string, unknown>">
  import { type SuperForm } from 'sveltekit-superforms'

  export let form: SuperForm<T>

  $: errors = form.errors
</script>

<!-- Form level errors -->
{#if $errors._errors}
  <div class="text-center text-sm text-error">
    <ul>
      {#each $errors._errors as error}
        <li>{error}</li>
      {/each}
    </ul>
  </div>
{/if}
