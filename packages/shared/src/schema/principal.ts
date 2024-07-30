import * as S from '@effect/schema/Schema'
import { optional } from './utils.js'

export const AuthType = S.Literal('email', 'apple', 'google', 'passkey')

export type AuthType = S.Schema.Type<typeof AuthType>

export const User = S.Struct({
  id: S.String,
  givenName: S.String,
  familyName: S.String,
  email: S.String,
  emailVerified: S.Boolean,
})

export type User = S.Schema.Type<typeof User>

export const AuthenticationRequired = S.Struct({
  requiredAuthType: AuthType,
})

const DateFromSeconds = S.transform(S.Number, S.DateFromSelf, {
  encode: date => Math.round(date.getTime() / 1000),
  decode: dateNum => new Date(dateNum * 1000),
})

const BasePrincipal = S.Struct({
  iss: S.String,
  aud: S.String,
  sub: S.String,
  iat: DateFromSeconds,
  nbf: DateFromSeconds,
  exp: DateFromSeconds,
  jti: S.String,
  token: S.String,
  user_verified: S.Boolean,
  auth_type: AuthType,
  auth_id: S.String,
})

export const Principal = S.Struct({
  ...BasePrincipal.fields,
  given_name: optional(S.String),
  family_name: optional(S.String),
  email: optional(S.String),
  email_verified: optional(S.Boolean),
})

export type Principal = S.Schema.Type<typeof Principal>

export const UserPrincipal = S.Struct({
  ...BasePrincipal.fields,
  given_name: S.String,
  family_name: S.String,
  email: S.String,
  email_verified: S.Boolean,
})

export type UserPrincipal = S.Schema.Type<typeof UserPrincipal>
