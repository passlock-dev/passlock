import { applyAction } from '$app/forms'
import { goto } from '$app/navigation'
import { Passlock, type PasslockProps } from '@passlock/client'
import type { SubmitFunction } from '@sveltejs/kit'
import { onMount } from 'svelte'
import { writable } from 'svelte/store'

export type RegisterProps = PasslockProps & {
  mappings?: Record<'email' | 'givenName' | 'familyName', string>
}

export const register = (options: RegisterProps) => {
  const passlock = new Passlock(options)
  const submitting = writable(false)

  const mappings = options.mappings ?? {
    email: 'email',
    givenName: 'givenName',
    familyName: 'familyName'
  }
  
  onMount(async () => {
    await passlock.preConnect()
  })

  return {
    passlock,
    submitting,
    onSubmit: (async ({ formData, cancel }) => {
      submitting.set(true)
  
      const email = formData.get(mappings.email) as string
      const givenName = formData.get(mappings.givenName) as string
      const familyName = formData.get(mappings.familyName) as string
  
      const result = await passlock.registerPasskey({ 
        email, givenName, familyName
      })

      console.log({ result: JSON.stringify(result) })

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