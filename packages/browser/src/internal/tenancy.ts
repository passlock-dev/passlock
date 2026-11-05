import { Context } from "effect"

export class TenancyId extends Context.Service<TenancyId, { readonly tenancyId: string }>()(
  "TenancyId"
) {}
