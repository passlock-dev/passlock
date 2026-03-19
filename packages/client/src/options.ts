/**
 * Shared Passlock tenancy and API endpoint options.
 */
export interface PasslockOptions {
  /**
   * Obtain this from the settings tab in your Passlock console.
   * Please note this is environment specific, so your dev
   * environment will have a different tenancyId to prod.
   */
  tenancyId: string

  /**
   * Override the default Passlock API base URL.
   *
   * Useful for tests, regional deployments, or self-hosted Passlock setups.
   * When omitted, requests are sent to `https://api.passlock.dev`.
   */
  endpoint?: string
}
