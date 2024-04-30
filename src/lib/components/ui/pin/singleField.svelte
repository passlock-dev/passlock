<!--
  @component
  
  Single field, 6 digit PIN input component.
  When 6 digits are entered (or pasted) the component fires a 'complete' event.

  Usage:

  ```html
  <SingleFieldPIN {form} field="code" />
  ```
-->
<script lang="ts" generics="T extends Record<string, unknown>">
  import { createEventDispatcher } from 'svelte'

  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy
  } from 'sveltekit-superforms'

  export let form: SuperForm<T>
  export let field: FormPathLeaves<T, string>
  const { value, errors } = formFieldProxy(
    form,
    field
  ) satisfies FormFieldProxy<string>

  const dispatch = createEventDispatcher<{ complete: void }>()

  const focus = (el: HTMLInputElement) => {
    el.focus()
  }

  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text')

    if (text && text.length === 6) {
      value.set(text)
      dispatch('complete')
    }
  }

  const onKeyUp = (e: KeyboardEvent) => {
    if ($value && $value.length === 6) {
      dispatch('complete')
    }
  }
</script>

<div>
  <input
    use:focus
    bind:value={$value}
    on:paste={onPaste}
    on:keyup={onKeyUp}
    type="text"
    inputmode="numeric"
    id="code"
    name="code"
    autocomplete="one-time-code"
    maxlength="6"
    class="pin text-lg tracking-[0.5em] w-full" />

  {#if $errors}
    <div class="mt-2 text-sm text-red-600 dark:text-red-400">
      <ul>
        {#each $errors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
