<!--
  Single field, 6 digit PIN input component.
  When 6 digits are entered (or pasted) the component fires a 'complete' event 
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let pin: string

  const dispatch = createEventDispatcher<{ complete: void }>()

  const focus = (element: HTMLInputElement) => {
    element.focus()
  }

  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text')

    if (text && text.length === 6) {
      pin = text
      dispatch('complete')
    }
  }

  const isNum = (e: KeyboardEvent) => ['0','1','2','3','4','5','6','7','8','9'].includes(e.key)

  const onKeyUp = (e: KeyboardEvent) => {
    if (isNum(e) && pin && pin.length === 6) {
      dispatch('complete')
    } 
  }
</script>

<input
  use:focus
  bind:value={pin}
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
