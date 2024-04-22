<script lang="ts">
  export let value: string
  export let name: string
  export let displayName: string
  export let error = ''
  
  $:border = error ? 'border-red-600' : 'border-gray-200 dark:border-gray-700'
</script>

<div>
  <label for={name} class="block text-sm mb-2 dark:text-white">{displayName}</label>
  <div class="relative">
    <input 
      bind:value 
      type="email" 
      id={name} 
      name={name} 
      autocomplete="email"       
      required={$$restProps.required}
      disabled={$$restProps.disabled}
      class="
        py-3 
        px-4 
        block 
        w-full 
        {border}
        rounded-lg 
        text-sm 
        focus:border-blue-500 
        focus:ring-blue-500 
        disabled:opacity-50 
        disabled:pointer-events-none 
        dark:bg-slate-900 
        dark:text-gray-400 
        dark:focus:ring-gray-600" />
    {#if error}
      <div class="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>
    {/if}
  </div>
</div>