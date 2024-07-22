import { Context } from 'effect'

export class Config extends Context.Tag('Config')<
  Config,
  {
    readonly tenancyId: string
    readonly apiKey: string
    readonly endpoint?: string
  }
>() {}
