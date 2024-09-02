import type { Actions, PageServerLoad } from './$types'
import { createTodo, deleteTodo, findAllTodos } from '$lib/server/db'
import { error, fail, redirect } from '@sveltejs/kit'
import { login } from '$lib/routes'
import { message, superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import { todoSchema } from '$lib/schemas'

export const load = (async ({ locals }) => {
  const user = locals.user
  if (!user) error(302, login)

  const form = await superValidate(valibot(todoSchema))
  const todos = await findAllTodos(user.id)

  return { todos, form }
}) satisfies PageServerLoad

const isString = (value: FormDataEntryValue | null): value is string => {
  if (value === null) return false
  if (typeof value !== 'string') return false
  if (value.length < 1) return false
  return true
}

export const actions: Actions = {
  createTodo: async ({ locals, request }) => {
    const user = locals.user
    if (!user) redirect(302, login)

    const form = await superValidate(request, valibot(todoSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    await createTodo({ 
      userId: user.id, 
      id: crypto.randomUUID(), 
      text: form.data.text
    })

    return message(form, 'Form posted successfully!')
  },

  deleteTodo: async ({ locals, request }) => {
    const user = locals.user
    if (!user) redirect(302, login)

    const formData = await request.formData()
    const id = formData.get('id')
    if (!isString(id)) error(400, "Invalid Todo id")

    await deleteTodo({ userId: user.id, id })

    return { success: true }
  }
}
