<!--
  @component
  Accessible input field that pairs with a Superform.

  Usage:

  ```html
  <InputEmail {form} field="givenName" label="First name">
    <div slot="description">lorem ipsum dolor sit amet</div>
  </InputEmail>
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
  import type { HTMLInputAttributes } from 'svelte/elements'

  import { generateId } from './utils'

  import { formFieldProxy, type FormPathLeaves, type SuperForm } from 'sveltekit-superforms'

  type $$Props = Omit<HTMLInputAttributes, 'form'> & {
    form: SuperForm<T>
    field: FormPathLeaves<T>
    label: string
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
  export let label: string

  const { value, errors, constraints } = formFieldProxy(form, field)

  $: invalid = Array.isArray($errors) && $errors.length ? true : undefined
  $: id = `${field}-${generateId()}`
  $: errId = invalid ? `${id}-error` : undefined
</script>

<div class="form-control">
  <label for={id} class="label">
    <span class="label-text">{label}</span>
  </label>

  <input
    type="email"
    name={field}
    {id}
    aria-invalid={invalid}
    aria-describedby={errId}
    bind:value={$value}
    {...$constraints}
    {...$$restProps}
    class="input input-bordered {invalid ? 'input-error' : ''}" />

  {#if $errors}
    <div class="label">
      {#each $errors as error}
        <span class="text-sm text-error">{error}</span>
      {/each}
    </div>
  {:else if $$slots.description}
    <div class="label">
      <span class="text-sm">
        <slot name="description" />
      </span>
    </div>
  {/if}
</div>
