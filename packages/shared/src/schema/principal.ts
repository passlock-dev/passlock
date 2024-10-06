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
  // jwt stuff
  iss: S.String,
  aud: S.String,
  sub: S.String,
  iat: DateFromSeconds,
  nbf: DateFromSeconds,
  exp: DateFromSeconds,
  jti: S.String,
  token: S.String,
  // custom
  userVerified: S.Boolean,
  authType: AuthType,
  authId: S.String,
  // legacy
  authStatement: S.Struct({
    authType: AuthType,
    userVerified: S.Boolean,
    authTimestamp: S.Date,
  }),
  expireAt: S.Date,
})

export const Principal = S.Struct({
  ...BasePrincipal.fields,
  givenName: optional(S.String),
  familyName: optional(S.String),
  email: optional(S.String),
  emailVerified: optional(S.Boolean),
  // legacy
  user: optional(
    S.Struct({
      id: S.String,
      givenName: S.String,
      familyName: S.String,
      email: S.String,
      emailVerified: S.Boolean,
    }),
  ),
})

export type Principal = S.Schema.Type<typeof Principal>

export const UserPrincipal = S.Struct({
  ...BasePrincipal.fields,
  givenName: S.String,
  familyName: S.String,
  email: S.String,
  emailVerified: S.Boolean,
  // legacy
  user: S.Struct({
    id: S.String,
    givenName: S.String,
    familyName: S.String,
    email: S.String,
    emailVerified: S.Boolean,
  }),
})

export type UserPrincipal = S.Schema.Type<typeof UserPrincipal>

export const decodePrincipal = S.decodeUnknown(S.Union(Principal, UserPrincipal))
export const isPrincipal = S.is(Principal)
export const isUserPrincipal = S.is(UserPrincipal)
