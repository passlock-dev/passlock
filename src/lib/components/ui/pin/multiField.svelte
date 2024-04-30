<!--
  @component
  
  Multi field, 6 digit PIN input component that pairs with a SuperForm.
  Entering a value in one field moves the cursor onto the next.
  Pasting a 6 digit value in the first field completes all 6 fields.
  When all 6 fields are complete the component fires a 'complete' event.

  Usage:

  ```html
  <MultiFieldPIN {form} field="code" />
  ```
-->
<script lang="ts" generics="T extends Record<string, unknown>">
  import { createEventDispatcher, onDestroy } from 'svelte'

  import { createPinInput, melt } from '@melt-ui/svelte'

  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy
  } from 'sveltekit-superforms'

  import { cn } from '$lib/utils.js'

  let className: string | undefined = undefined
  export { className as class }

  const dispatch = createEventDispatcher<{ complete: void }>()

  export let form: SuperForm<T>
  export let field: FormPathLeaves<T, string>
  const { value, errors } = formFieldProxy(
    form,
    field
  ) satisfies FormFieldProxy<string>

  const {
    elements: { root, input },
    states: { valueStr }
  } = createPinInput({})

  const unsubscribe = valueStr.subscribe(pin => {
    value.set(pin)

    if (pin.length === 6) {
      dispatch('complete')
    }
  })

  const focus = (el: HTMLInputElement) => {
    el.focus()
  }

  const pinClass =
    'block text-center border border-primary/20 rounded-md text-sm font-mono font-semibold [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none size-[46px] bg-background'

  onDestroy(() => {
    unsubscribe()
  })
</script>

<div>
  <div use:melt={$root} class="flex items-center gap-2">
    <input class={cn(pinClass, className)} use:melt={$input()} use:focus />

    {#each Array.from({ length: 5 }) as _}
      <input class={pinClass} use:melt={$input()} />
    {/each}
  </div>

  {#if $errors}
    <div class="mt-2 text-sm text-red-600">
      <ul>
        {#each $errors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
