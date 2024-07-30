import * as S from '@effect/schema/Schema'

export const VerifyEmailByLink = S.Struct({
  method: S.Literal('link'),
  redirectUrl: S.String,
})

export type VerifyEmailByLink = S.Schema.Type<typeof VerifyEmailByLink>

export const VerifyEmailByCode = S.Struct({
  method: S.Literal('code'),
})

export type VerifyEmailByCode = S.Schema.Type<typeof VerifyEmailByCode>

export const VerifyEmail = S.Union(VerifyEmailByLink, VerifyEmailByCode)

export type VerifyEmail = S.Schema.Type<typeof VerifyEmail>
