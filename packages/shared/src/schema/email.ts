import * as S from '@effect/schema/Schema'

export const VerifyEmailLink = S.Struct({
  method: S.Literal('link'),
  redirectUrl: S.String
})

export type VerifyEmailLink = S.Schema.Type<typeof VerifyEmailLink>

export const VerifyEmailCode = S.Struct({
  method: S.Literal('code'),
})

export type VerifyEmailCode = S.Schema.Type<typeof VerifyEmailCode>

export const VerifyEmail = S.Union(VerifyEmailLink, VerifyEmailCode)

export type VerifyEmail = S.Schema.Type<typeof VerifyEmail>