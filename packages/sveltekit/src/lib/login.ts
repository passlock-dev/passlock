import { applyAction } from '$app/forms'
import { goto } from '$app/navigation'
import { Passlock, type PasslockProps } from '@passlock/client'
import type { SubmitFunction } from '@sveltejs/kit'
import { onMount } from 'svelte'
import { writable } from 'svelte/store'

export type LoginProps = PasslockProps & {
  mappings?: Record<'email', string>
}

export const login = (options: LoginProps) => {
  const passlock = new Passlock(options)
  const submitting = writable(false)
  const mappings = options.mappings ?? { email: 'email' }

  onMount(async () => {
    await passlock.preConnect()
  })
  
  return {
    passlock,
    submitting,
    onSubmit: (async ({ formData, cancel }) => {
      submitting.set(true)

      const email = formData.get(mappings.email) as string

      const result = await passlock.authenticatePasskey({ email })

      if (Passlock.isPrincipal(result)) {
        formData.set('token', result.token)
      } else {
        submitting.set(false)
        cancel()
        alert(result.message)
      }

      return async ({ result }) => {
        // form action completed so hide the spinner
        submitting.set(false)
        if (result.type === 'redirect') {
          goto(result.location)
        } else {
          await applyAction(result)
        }
      }  
    }) satisfies SubmitFunction
  }
}