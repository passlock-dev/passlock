import * as S from '@effect/schema/Schema'

export const AuthType = S.Literal(
  'email', 
  'apple', 
  'google', 
  'passkey'
)

export type AuthType = S.Schema.Type<typeof AuthType>

/** Represents a successful registration/authentication */
export const Principal = S.Struct({
  token: S.String,
  user: S.Struct({
    id: S.String,
    givenName: S.String,
    familyName: S.String,
    email: S.String,
    emailVerified: S.Boolean,
  }),
  authenticator: S.Struct({
    id: S.String,
    type: AuthType,
    userVerified: S.Boolean,
  }),
  authTimestamp: S.Date,
  expireAt: S.Date,
})



export type Principal = S.Schema.Type<typeof Principal>

export const AuthenticationRequired = S.Struct({
  requiredAuthType: AuthType,
})