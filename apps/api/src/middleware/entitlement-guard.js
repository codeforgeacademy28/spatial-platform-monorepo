import { checkFeatureEntitlement, } from '@spatial/billing';
const DEFAULT_SUBSCRIPTION_TIER = 'free';
const allowedTiers = ['free', 'pro', 'studio'];
function resolveSubscriptionTier(value) {
    const tier = Array.isArray(value) ? value[0] : value;
    if (typeof tier !== 'string') {
        return DEFAULT_SUBSCRIPTION_TIER;
    }
    const normalized = tier.trim().toLowerCase();
    if (allowedTiers.includes(normalized)) {
        return normalized;
    }
    return DEFAULT_SUBSCRIPTION_TIER;
}
export function requireEntitlement(feature) {
    return (req, res, next) => {
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
//# sourceMappingURL=entitlement-guard.js.map