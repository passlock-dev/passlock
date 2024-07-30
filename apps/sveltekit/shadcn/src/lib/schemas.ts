import * as v from 'valibot'

export const registrationFormSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  given_name: v.pipe(v.string(), v.minLength(2)),
  family_name: v.pipe(v.string(), v.minLength(2)),
  accept_terms: v.boolean(),
  token: v.string(),
  auth_type: v.picklist(['passkey', 'email', 'apple', 'google']),
  verify_email: v.optional(v.picklist(['link', 'code']))
})

export type RegistrationFormSchema = typeof registrationFormSchema

export const loginFormSchema = v.object({
  email: v.optional(v.pipe(v.string(), v.email())),
  token: v.string(),
  auth_type: v.picklist(['passkey', 'email', 'apple', 'google'])
})

export type LoginFormSchema = typeof loginFormSchema

export const verifyEmailSchema = v.object({
  code: v.string(),
  token: v.string()
})

export type VerifyEmailSchema = typeof verifyEmailSchema
