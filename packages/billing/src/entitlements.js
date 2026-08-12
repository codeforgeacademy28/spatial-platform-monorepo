export function checkFeatureEntitlement(feature, tier = 'free') {
    if (feature === 'project-sharing') {
        return {
            allowed: true,
            feature,
            tier,
            reason: tier === 'free' ? 'Public design sharing enabled in MVP mode.' : undefined,
        };
    }
    if (feature === 'FEATURE_AI_ASSISTANT') {
        if (tier === 'studio') {
            return { allowed: true, feature, tier };
        }
        return {
            allowed: false,
            feature,
            tier,
            reason: 'AI assistant requires Studio tier upgrade.',
        };
    }
    return { allowed: true, feature, tier };
}
//# sourceMappingURL=entitlements.js.map