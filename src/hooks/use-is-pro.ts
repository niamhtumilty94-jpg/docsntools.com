/**
 * Returns whether the current viewer is on the Pro plan.
 *
 * Today this is a stub - it always returns `false` until the auth + Stripe
 * pieces ship. The contract is intentionally synchronous so that consumers
 * (AdSlot, paywalled tools) can use it inline without needing Suspense.
 *
 * When auth lands, replace the body with a useSyncExternalStore subscription
 * to the auth/subscription state. Don't break the signature.
 */
export function useIsPro(): boolean {
  return false;
}
