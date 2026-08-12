export type SubscriptionTier = 'free' | 'pro' | 'studio';
export type FeatureName = 'project-sharing' | 'FEATURE_AI_ASSISTANT';
export interface EntitlementCheck {
    allowed: boolean;
    feature: FeatureName;
    tier: SubscriptionTier;
    reason?: string;
}
export declare function checkFeatureEntitlement(feature: FeatureName, tier?: SubscriptionTier): EntitlementCheck;
//# sourceMappingURL=entitlements.d.ts.map