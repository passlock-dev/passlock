import { Context } from "effect";

export class TenancyId extends Context.Tag("TenancyId")<
  TenancyId,
  { readonly tenancyId: string }
>() {}
