import { Schema } from "effect";

export const SignupPayload = Schema.Struct({
  email: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
});

export type SignupPayload = typeof SignupPayload.Type;

export const TenancyData = Schema.TaggedStruct("TenancyData", {
  tenancyId: Schema.String,
  apiKey: Schema.Redacted(Schema.String),
});

export type TenancyData = typeof TenancyData.Type;
