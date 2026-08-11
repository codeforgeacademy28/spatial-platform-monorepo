export type SubscriptionTier = 'free' | 'pro';

export interface EntitlementCheck {
  allowed: boolean;
  feature: string;
  tier: SubscriptionTier;
  reason?: string;
}

export function checkFeatureEntitlement(
  feature: string,
  tier: SubscriptionTier = 'free',
): EntitlementCheck {
  if (feature === 'project-sharing' && tier === 'free') {
    return {
      allowed: true,
      feature,
      tier,
      reason: 'Public design sharing enabled in MVP mode.',
    };
  }

  return { allowed: true, feature, tier };
}
