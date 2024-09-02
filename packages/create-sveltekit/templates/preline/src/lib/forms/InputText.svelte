<!--
  @component
  Accessible input field that pairs with a Superform.

  Usage:

  ```html
  <InputText {form} field="givenName" label="First name">
    <div slot="description">lorem ipsum dolor sit amet</div>
  </InputText>
  ```

  **Important** - pass in a `SuperForm`, not `SuperFormData` i.e.

   ```javascript
  // correct
  const form = superform()
  // wrong
  const { form } = superform()
  ```
-->
<script lang="ts" generics="T extends Record<string, unknown>">
  import * as Icons from '$lib/icons'
  import type { HTMLInputAttributes } from 'svelte/elements'

  import { generateId } from './utils'

  import { formFieldProxy, type FormPathLeaves, type SuperForm } from 'sveltekit-superforms'

  type $$Props = Omit<HTMLInputAttributes, 'form'> & {
    form: SuperForm<T>
    field: FormPathLeaves<T>
    label?: string | undefined
  }

  /**
   * Make sure you pass in a raw Superform, i.e. const form = superform(...),
   * not const { form } = superform(...)
   */
  export let form: SuperForm<T>

  /**
   * A field on the form e.g. "givenName"
   */
  export let field: FormPathLeaves<T>

  /**
   * Display label e.g. "First name"
   */
  export let label: string | undefined = undefined

  const { value, errors, constraints } = formFieldProxy(form, field)

  $: invalid = Array.isArray($errors) && $errors.length ? true : undefined
  $: id = `${field}-${generateId()}`
  $: errId = invalid ? `${id}-error` : undefined
</script>

<div>
  {#if label}
    <label for={id} class="block text-sm mb-2 text-base-950 dark:text-white">{label}</label>
  {/if}

  <div class="relative">
    <input
      {id}
      name={field}
      type="text"
      aria-invalid={invalid}
      aria-describedby={errId}
      bind:value={$value}
      {...$constraints}
      {...$$restProps}
      class="input" />

    {#if $errors}
      <div class="absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3">
        <Icons.FieldError class="size-5 flex-shrink-0 text-red-600 dark:text-red-400" />
      </div>
    {/if}
  </div>

  {#if $errors}
    <div id={errId} class="mt-2 text-sm text-red-600 dark:text-red-400">
      <ul>
        {#each $errors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if $$slots.description}
    <div class="mt-2 text-sm text-base-600 dark:text-base-400">
      <slot name="description" />
    </div>
  {/if}
</div>
