"use client";

import React, { useState } from 'react';
import { APIKeyManager } from '@/components/customer-dashboard/APIKeyManager';
import { UsageDashboard } from '@/components/customer-dashboard/UsageDashboard';
import { BillingManager } from '@/components/customer-dashboard/BillingManager';
import { TierBadge } from '@/components/licensing/TierBadge';
import { useUser } from '@/lib/user-context';
import { checkBeastModeLicense, getLicenseInfo } from '@/lib/licensing';

type Tab = 'api-keys' | 'usage' | 'billing';

export default function CustomerDashboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('api-keys');
  const [license, setLicense] = React.useState<{
    tier: string;
    type: string;
  } | null>(null);

  React.useEffect(() => {
    async function loadLicense() {
      if (user?.id) {
        const licenseCheck = await checkBeastModeLicense(user.id);
        if (licenseCheck.hasLicense) {
          setLicense({ tier: licenseCheck.tier, type: licenseCheck.type });
        }
      }
    }
    loadLicense();
  }, [user?.id]);

  const tabs = [
    { id: 'api-keys' as Tab, label: 'API Keys', icon: '🔑' },
    { id: 'usage' as Tab, label: 'Usage', icon: '📊' },
    { id: 'billing' as Tab, label: 'Billing', icon: '💳' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Customer Dashboard</h1>
            {license && <TierBadge tier={license.tier} />}
          </div>
          <p className="text-slate-400">Manage your BEAST MODE account, API keys, and billing</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-cyan-500 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'api-keys' && <APIKeyManager />}
          {activeTab === 'usage' && <UsageDashboard />}
          {activeTab === 'billing' && <BillingManager />}
        </div>
      </div>
    </div>
  );
}

