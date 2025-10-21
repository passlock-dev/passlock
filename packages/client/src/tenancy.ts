import { Context } from "effect";

export class TenancyId extends Context.Tag("TenancyId")<
  TenancyId,
  { readonly tenancyId: string }
>() {}

export const buildTenancyId = ({ tenancyId } : { tenancyId: string }) => TenancyId.of({ tenancyId })