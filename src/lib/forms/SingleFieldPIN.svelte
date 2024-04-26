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
  const { value, errors } = formFieldProxy(form, field) satisfies FormFieldProxy<string>

  const dispatch = createEventDispatcher<{ complete: void }>()

  const focus = (el: HTMLInputElement) => { el.focus() }

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
  class="
    font-mono
    text-lg
    text-center
    tracking-[0.5em]
    w-full
    p-2
    border-gray-200
    rounded-md
    [&::-webkit-outer-spin-button]:appearance-none
    [&::-webkit-inner-spin-button]:appearance-none
    focus:border-blue-500
    focus:ring-blue-500
    disabled:opacity-50
    disabled:pointer-events-none
    dark:bg-slate-900
    dark:border-gray-700
    dark:text-gray-400
    dark:focus:ring-gray-600" />

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
