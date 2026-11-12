import { Schema } from "effect"

const utf8 = new TextEncoder()
const validText = (value: string) => {
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0
    if (point <= 0x1f || point === 0x7f || (point >= 0xd800 && point <= 0xdfff)) return false
  }
  return true
}
const text = (max: number, label = false, colon = false) =>
  Schema.String.check(
    Schema.makeFilter((value) => {
      const checked = label ? value.trim() : value
      return (
        checked.trim().length > 0 &&
        validText(value) &&
        utf8.encode(checked).length <= max &&
        (!colon || !checked.includes(":"))
      )
    })
  )
const UserId = text(256)
const Id = Schema.String.check(Schema.isPattern(/^[a-z0-9]{15}$/))
const Algorithm = Schema.Literals(["SHA1", "SHA256", "SHA512"])
const Digits = Schema.Literals([6, 8])
const Period = Schema.Literals([30, 60])
const Window = Schema.Literals([0, 1])

export const CreateTotpAuthenticatorOptions = Schema.Struct({
  userId: UserId,
  issuer: text(128, true, true),
  username: text(128, true, true),
  displayName: Schema.optionalKey(text(120, true)),
  totp: Schema.optionalKey(
    Schema.Struct({
      algorithm: Schema.optionalKey(Algorithm),
      digits: Schema.optionalKey(Digits),
      period: Schema.optionalKey(Period),
    })
  ),
  verification: Schema.optionalKey(Schema.Struct({ window: Schema.optionalKey(Window) })),
  enrollmentExpiresIn: Schema.optionalKey(
    Schema.Int.check(Schema.isBetween({ minimum: 300, maximum: 1800 }))
  ),
})
export const GetTotpAuthenticatorOptions = Schema.Struct({ userId: UserId, authenticatorId: Id })
export const DeleteTotpAuthenticatorOptions = GetTotpAuthenticatorOptions
export const VerifyTotpOptions = Schema.Struct({
  ...GetTotpAuthenticatorOptions.fields,
  code: Schema.String.check(Schema.isPattern(/^(?:[0-9]{6}|[0-9]{8})$/)),
})
export const ConfirmTotpAuthenticatorOptions = VerifyTotpOptions
export const ListTotpAuthenticatorsOptions = Schema.Struct({
  userId: UserId,
  cursor: Schema.optionalKey(Schema.String.check(Schema.isMaxLength(2048))),
})

export const TotpAuthenticatorDetails = Schema.TaggedStruct("TotpAuthenticator", {
  id: Id,
  userId: UserId,
  issuer: Schema.String,
  username: Schema.String,
  displayName: Schema.optionalKey(Schema.String),
  createdAt: Schema.Int,
  totp: Schema.Struct({ algorithm: Algorithm, digits: Digits, period: Period }),
  verification: Schema.Struct({ window: Window }),
})
export const PendingTotpAuthenticator = Schema.Struct({
  ...TotpAuthenticatorDetails.fields,
  status: Schema.Literal("pending"),
  expiresAt: Schema.Int,
})
export const ActiveTotpAuthenticator = Schema.Struct({
  ...TotpAuthenticatorDetails.fields,
  status: Schema.Literal("active"),
  confirmedAt: Schema.Int,
  lastUsed: Schema.optionalKey(Schema.Int),
})
export const TotpAuthenticator = Schema.Union([PendingTotpAuthenticator, ActiveTotpAuthenticator])
export const TotpSetup = Schema.Struct({
  secret: Schema.String,
  uri: Schema.String,
  qrCodeDataUrl: Schema.String,
})
export const TotpAuthenticatorCreated = Schema.TaggedStruct("TotpAuthenticatorCreated", {
  authenticator: PendingTotpAuthenticator,
  setup: TotpSetup,
})
export const TotpAuthenticatorConfirmed = Schema.TaggedStruct("TotpAuthenticatorConfirmed", {
  authenticator: ActiveTotpAuthenticator,
})
export const TotpVerified = Schema.TaggedStruct("TotpVerified", {
  userId: UserId,
  authenticatorId: Id,
  verifiedAt: Schema.Int,
})
export const FindAllTotpAuthenticators = Schema.TaggedStruct("FindAllTotpAuthenticators", {
  records: Schema.Array(TotpAuthenticator),
  cursor: Schema.NullOr(Schema.String),
})
export const TotpAuthenticatorDeleted = Schema.TaggedStruct("TotpAuthenticatorDeleted", {})
