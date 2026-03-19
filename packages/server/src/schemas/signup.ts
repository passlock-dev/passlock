import { Schema } from "effect"

/**
 * Schema for the signup payload accepted by Passlock signup flows.
 *
 * @category Signup
 */
export const SignupPayload = Schema.Struct({
  email: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
})

/**
 * Type produced by {@link SignupPayload}.
 *
 * @category Signup
 */
export type SignupPayload = typeof SignupPayload.Type

/**
 * Schema for tenancy credentials returned after signup.
 *
 * @category Signup
 */
export const TenancyData = Schema.TaggedStruct("TenancyData", {
  apiKey: Schema.Redacted(Schema.String),
  tenancyId: Schema.String,
})

/**
 * Type produced by {@link TenancyData}.
 *
 * @category Signup
 */
export type TenancyData = typeof TenancyData.Type
