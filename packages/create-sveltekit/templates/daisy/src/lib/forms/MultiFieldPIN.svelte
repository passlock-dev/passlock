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
  import { createPinInput, melt } from '@melt-ui/svelte'
  import { createEventDispatcher, onDestroy } from 'svelte'

  const dispatch = createEventDispatcher<{ complete: void }>()

  import { formFieldProxy, type FormFieldProxy, type FormPathLeaves, type SuperForm } from 'sveltekit-superforms'

  export let form: SuperForm<T>
  export let field: FormPathLeaves<T, string>
  const { value, errors } = formFieldProxy(form, field) satisfies FormFieldProxy<string>

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

  onDestroy(() => {
    unsubscribe()
  })
</script>

<div>
  <div use:melt={$root} class="flex items-center gap-2">
    <input class="pin size-[46px]" use:melt={$input()} use:focus />

    {#each Array.from({ length: 5 }) as _}
      <input class="pin size-[46px]" use:melt={$input()} />
    {/each}
  </div>

  {#if $errors}
    <div class="mt-2 text-sm text-error">
      <ul>
        {#each $errors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
