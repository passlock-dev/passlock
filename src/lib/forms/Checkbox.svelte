<!--
  @component
  Accessible checkbox that pairs with a Superform.

  Usage:

  ```html
  <Checkbox {form} field="acceptTerms">
    <div slot="label">I accept the terms and conditions</div>
    <div slot="description">lorem ipsum dolor sit amet</div>
  </Checkbox>
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
  import { generateId } from './utils'

  import {
    formFieldProxy,
    type FormFieldProxy,
    type FormPathLeaves,
    type SuperForm
  } from 'sveltekit-superforms'

  /**
   * Make sure you pass in a raw Superform, i.e. const form = superform(...),
   * not const { form } = superform(...)
   */
  export let form: SuperForm<T>

  /**
   * A field on the form e.g. "acceptTerms"
   */
  export let field: FormPathLeaves<T, boolean>

  const { value, errors, constraints } = formFieldProxy(
    form,
    field
  ) satisfies FormFieldProxy<boolean>

  $:id = `${field}-${generateId()}`
</script>

<div>
  <div class="flex items-center gap-2">
    <input
      {id}
      name={field}
      type="checkbox"
      bind:checked={$value}
      {...$constraints}
      {...$$restProps}
      class="checkbox" />
  
    <label for={id} class="cursor-pointer text-sm dark:text-white">
      <slot name="label" />
    </label>
  </div>

  {#if $errors}
    {#each $errors as error}
      <div class="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>
    {/each}
  {/if}

  {#if $$slots.description}
    <div class="mt-2 text-sm text-base-700 dark:text-base-400">
      <slot name="description" />
    </div>
  {/if}
</div>

