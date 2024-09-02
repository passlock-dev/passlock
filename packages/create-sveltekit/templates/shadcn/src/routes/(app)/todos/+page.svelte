<script lang="ts">
  import { enhance } from '$app/forms'
  import type { PageData } from './$types'
  export let data: PageData
  import * as Icons from '$lib/icons'
  import * as Forms from '$lib/ui/forms'
  import { superForm } from 'sveltekit-superforms'

  const form = superForm(data.form)
  const { enhance: enhanceSupermenu, submitting } = form
</script>

<div class="container mx-auto py-12">
  <h1 class="text-2xl font-bold text-center">My TODOs</h1>

  <div class="w-full flex justify-center">
    <div class="flex flex-col gap-6 mt-6 w-full sm:w-1/2">
      <div
        class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700 border rounded-lg p-3 border-gray-200 dark:border-gray-700">
        {#if data.todos && data.todos.length > 0}
          {#each data.todos as todo (todo.id)}
            <div class="p-4 flex items-center gap-2">
              <form method="post" action="?/deleteTodo" use:enhance>
                <input type="hidden" name="id" value={todo.id} />

                <button class="flex items-center" tabindex="0">
                  <Icons.Trash class="size-6" />
                </button>
              </form>
              <div>{todo.text}</div>
            </div>
          {/each}
        {:else}
          <div class="p-4">No TODOs</div>
        {/if}
      </div>

      <Forms.Divider>Add a TODO</Forms.Divider>

      <form method="post" action="?/createTodo" use:enhanceSupermenu>
        <Forms.InputText
          {form}
          field="text"
          placeholder="Remember to star this template on GitHub"
          autocomplete="off"
          autofocus />

        <Forms.SubmitButton submitting={$submitting} class="mt-4">Add TODO</Forms.SubmitButton>
      </form>
    </div>
  </div>
</div>
