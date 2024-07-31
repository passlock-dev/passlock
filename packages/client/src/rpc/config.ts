import type { Schedule } from 'effect'
import { Context } from 'effect'

export class RpcConfig extends Context.Tag('@rpc/RpcConfig')<
  RpcConfig,
  {
    endpoint?: string
    tenancyId: string
    clientId: string
  }
>() {}

export class RetrySchedule extends Context.Tag('@rpc/RetrySchedule')<
  RetrySchedule,
  {
    schedule: Schedule.Schedule<unknown>
  }
>() {}
