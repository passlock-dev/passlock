/**
 * Options that are not directly related to passkeys or
 * other authentication mechanisms, but required by the
 * Passlock framework
 */
export interface PasslockOptions {
  /**
   * Obtain this from the settings tab in your Passlock console.
   * Please note this is environment specific, so your dev
   * environment will have a different tenancyId to prod.
   */
  tenancyId: string

  /**
   * Currently used for testing, but also required to support
   * multi-region deployments and on-premise self-hosted setups.
   */
  endpoint?: string
}
