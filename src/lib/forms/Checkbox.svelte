<script lang="ts">
  export let name: string
</script>

<div class="flex items-center">
  <div class="flex">
    <input id={name} name={name} type="checkbox" class="shrink-0 mt-0.5 border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" required={$$restProps.required}>
  </div>
  <div class="ms-3">
    <label for={name} class="text-sm dark:text-white">
      <slot name="description" />
    </label>
  </div>
</div>