import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  checkFeatureEntitlement,
  type FeatureName,
  type SubscriptionTier,
} from '@spatial/billing';

const DEFAULT_SUBSCRIPTION_TIER: SubscriptionTier = 'free';
const allowedTiers: SubscriptionTier[] = ['free', 'pro', 'studio'];

function resolveSubscriptionTier(value: string | string[] | undefined): SubscriptionTier {
  const tier = Array.isArray(value) ? value[0] : value;
  if (typeof tier !== 'string') {
    return DEFAULT_SUBSCRIPTION_TIER;
  }

  const normalized = tier.trim().toLowerCase();
  if (allowedTiers.includes(normalized as SubscriptionTier)) {
    return normalized as SubscriptionTier;
  }

  return DEFAULT_SUBSCRIPTION_TIER;
}

export function requireEntitlement(feature: FeatureName): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const tier = resolveSubscriptionTier(req.header('x-subscription-tier'));
    const entitlement = checkFeatureEntitlement(feature, tier);

    if (!entitlement.allowed) {
      res.status(403).json({
        error: 'feature not allowed',
        feature,
        tier,
        reason: entitlement.reason ?? 'Upgrade your subscription to access this feature.',
      });
      return;
    }

    next();
  };
}
