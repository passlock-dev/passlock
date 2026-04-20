/**
 * Shared Passlock tenancy and API endpoint options used for browser requests.
 *
 * @category Passkeys (core)
 */
export interface PasslockOptions {
  /**
   * Tenancy identifier from the Passlock console settings page.
   *
   * This value is environment-specific, so development and production
   * tenancies use different IDs.
   */
  tenancyId: string

  /**
   * Override the Passlock API base URL.
   *
   * Useful for tests, regional deployments, or self-hosted Passlock setups.
   * When omitted, requests are sent to `https://api.passlock.dev`.
   */
  endpoint?: string
}
