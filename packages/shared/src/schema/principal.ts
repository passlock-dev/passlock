import * as S from '@effect/schema/Schema'
import { optional } from "./utils.js"

export const AuthType = S.Literal(
  'email', 
  'apple', 
  'google', 
  'passkey'
)

export type AuthType = S.Schema.Type<typeof AuthType>

export const User = S.Struct({
  id: S.String,
  givenName: S.String,
  familyName: S.String,
  email: S.String,
  emailVerified: S.Boolean,
})

export type User = S.Schema.Type<typeof User>

/** Represents a successful registration/authentication */
export const Principal = S.Struct({
  token: S.String,
  user: optional(User),
  authenticator: S.Struct({
    id: S.String,
    type: AuthType,
    userVerified: S.Boolean,
  }),
  authTimestamp: S.Date,
  expireAt: S.Date,
})

export type Principal = S.Schema.Type<typeof Principal>

const { user, ...rest } = Principal.fields

export const UserPrincipal = S.Struct({
  ...rest,
  user: User
})

export type UserPrincipal = S.Schema.Type<typeof UserPrincipal>

export const AuthenticationRequired = S.Struct({
  requiredAuthType: AuthType,
})