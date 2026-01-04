"use client";

import React from 'react';
import { checkBeastModeLicense, canAccessFeature, getLicenseInfo } from '@/lib/licensing';
import { useUser } from '@/lib/user-context';

interface LicenseGateProps {
  feature?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTier?: 'developer' | 'team' | 'sentinel';
}

export function LicenseGate({ 
  feature, 
  children, 
  fallback,
  requireTier 
}: LicenseGateProps) {
  const { user } = useUser();
  const [license, setLicense] = React.useState<{
    hasLicense: boolean;
    tier: string;
    type: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkLicense() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const licenseCheck = await checkBeastModeLicense(user.id);
        setLicense(licenseCheck);
      } catch (error) {
        console.error('License check failed:', error);
        setLicense({ hasLicense: false, tier: 'free', type: 'free' });
      } finally {
        setLoading(false);
      }
    }

    checkLicense();
  }, [user?.id]);

  if (loading) {
    return <div className="p-4">Checking license...</div>;
  }

  if (!license || !license.hasLicense) {
    return fallback || <UpgradePrompt />;
  }

  // Check tier requirement
  if (requireTier) {
    const tierOrder = ['free', 'developer', 'team', 'sentinel'];
    const userTierIndex = tierOrder.indexOf(license.tier);
    const requiredTierIndex = tierOrder.indexOf(requireTier);

    if (userTierIndex < requiredTierIndex) {
      return fallback || <UpgradePrompt requiredTier={requireTier} />;
    }
  }

  // Check feature access
  if (feature && !canAccessFeature(license, feature)) {
    return fallback || <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}

function UpgradePrompt({ 
  requiredTier, 
  feature 
}: { 
  requiredTier?: string;
  feature?: string;
}) {
  const licenseInfo = getLicenseInfo({ tier: 'free', type: 'free' });

  return (
    <div className="p-8 bg-slate-900 border border-slate-700 rounded-lg text-center">
      <h3 className="text-xl font-bold mb-4">Upgrade Required</h3>
      <p className="text-slate-400 mb-6">
        {requiredTier 
          ? `This feature requires a ${requiredTier} subscription.`
          : feature
          ? `This feature is not available in your current plan.`
          : 'Please upgrade to access this feature.'}
      </p>
      <a
        href="/dashboard?view=pricing"
        className="inline-block px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
      >
        View Pricing
      </a>
    </div>
  );
}

