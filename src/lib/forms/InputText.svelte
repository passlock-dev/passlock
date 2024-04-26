<!--
  @component
  Accessible input field that pairs with a Superform.

  Usage:

  ```html
  <TextInput {form} field="givenName" label="First name">
    <div slot="description">lorem ipsum dolor sit amet</div>
  </TextInput>
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
    type SuperForm,
    type FormPathLeaves
  } from 'sveltekit-superforms'

  import FieldError from '$lib/icons/FieldError.svelte'

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

  $:invalid = Array.isArray($errors) && $errors.length ? true : undefined
  $:id = `${field}-${generateId()}`
  $:errId = invalid ? `${id}-error` : undefined
</script>

<div>
  <label for={id} class="block text-sm mb-2 dark:text-white">{label}</label>
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
      class="
        py-3
        px-4
        block
        w-full
        rounded-lg
        text-sm
        read-only:opacity-50
        read-only:pointer-events-none
        focus:border-blue-500
        bg-white
        dark:bg-slate-900
        text-black
        dark:text-gray-400
        border-gray-200 
        dark:border-gray-700
        aria-invalid:border-red-600
        focus:ring-blue-500
        dark:focus:ring-gray-600" />

    {#if $errors}
      <div class="absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3">
        <FieldError />
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
    <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      <slot name="description" />
    </div>
  {/if}  
</div>
