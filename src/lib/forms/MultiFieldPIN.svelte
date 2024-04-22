<!--
  Multi field, 6 digit PIN input component.
  Entering a value in one field moves the cursor onto the next
  Pasting a 6 digit value in the first field completes all 6 fields
  When all 6 fields are complete the component fires a 'complete' event
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher<{ complete: void }>()

  export let pin: string | undefined = undefined

  let num1 = ''
  let num1Input: HTMLInputElement

  let num2 = ''
  let num2Input: HTMLInputElement
  
  let num3 = ''
  let num3Input: HTMLInputElement
  
  let num4 = ''
  let num4Input: HTMLInputElement
  
  let num5 = ''
  let num5Input: HTMLInputElement
  
  let num6 = ''
  let num6Input: HTMLInputElement

  $:pin = num1 + num2 + num3 + num4 + num5 + num6

  const isBackspace = (e: KeyboardEvent) => e.key === 'Backspace'
  const isNum = (e: KeyboardEvent) => ['0','1','2','3','4','5','6','7','8','9'].includes(e.key)
  
  const getCode = () => {
    return (
      num1 && num2 && num3 && num4 && num5 && num6
    ) ? 
      num1 + num2 + num3 + num4 + num5 + num6 
    : undefined
  }

  const num1Paste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text')

    if (text && text.length === 6) {
      num1 = text[0]
      num2 = text[1]
      num3 = text[2]
      num4 = text[3]
      num5 = text[4]
      num6 = text[5]
      num6Input.focus()
      dispatch('complete')
    }
  }

  const num1Press = (e: KeyboardEvent) => {
    if (isNum(e)) num2Input.focus()
  }

  const num2Press = (e: KeyboardEvent) => {
    if (isBackspace(e)) num1Input.focus(); 
    else if (isNum(e)) num3Input.focus();
  }

  const num3Press = (e: KeyboardEvent) => {
    if (isBackspace(e)) num2Input.focus(); 
    else if (isNum(e)) num4Input.focus();
  }

  const num4Press = (e: KeyboardEvent) => {
    if (isBackspace(e)) num3Input.focus(); 
    else if (isNum(e)) num5Input.focus();
  }

  const num5Press = (e: KeyboardEvent) => {
    if (isBackspace(e)) num4Input.focus(); 
    else if (isNum(e)) num6Input.focus();
  }

  const num6Press = (e: KeyboardEvent) => {
    const code = getCode()
    if (isBackspace(e)) num5Input.focus();
    else if (code) dispatch('complete')
  }

  onMount(() => {
    num1Input.focus()
  })

  const clazz = "block size-[46px] text-center border-gray-200 rounded-md text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
</script>

<div class="flex space-x-3">
  <input bind:this={num1Input} bind:value={num1} on:keyup={num1Press} on:paste|preventDefault={num1Paste} type="text" pattern="\d" maxlength="1" class={clazz} />
  <input bind:this={num2Input} bind:value={num2} on:keyup={num2Press} type="text" pattern="\d" maxlength="1" class={clazz} />
  <input bind:this={num3Input} bind:value={num3} on:keyup={num3Press} type="text" pattern="\d" maxlength="1" class={clazz} />
  <input bind:this={num4Input} bind:value={num4} on:keyup={num4Press} type="text" pattern="\d" maxlength="1" class={clazz} />
  <input bind:this={num5Input} bind:value={num5} on:keyup={num5Press} type="text" pattern="\d" maxlength="1" class={clazz} />
  <input bind:this={num6Input} bind:value={num6} on:keyup={num6Press} type="text" pattern="\d" maxlength="1" class={clazz} />
</div>