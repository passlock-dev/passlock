import { Schema } from "effect"

export const SignupPayload = Schema.Struct({
  email: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
})

export type SignupPayload = typeof SignupPayload.Type

export const TenancyData = Schema.TaggedStruct("TenancyData", {
  apiKey: Schema.Redacted(Schema.String),
  tenancyId: Schema.String,
})

export type TenancyData = typeof TenancyData.Type
