'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UpgradePromptProps {
  currentTier?: string;
  currentUsage?: number;
  limit?: number;
  actionType?: 'analyze_pr' | 'scan_repo' | 'api_call';
  onUpgrade?: () => void;
}

export default function UpgradePrompt({
  currentTier = 'free',
  currentUsage = 0,
  limit = 10,
  actionType = 'analyze_pr',
  onUpgrade
}: UpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt if user is at or near limit
    if (currentTier === 'free' && currentUsage >= limit * 0.8) {
      setIsVisible(true);
    }
  }, [currentTier, currentUsage, limit]);

  if (!isVisible && currentUsage < limit) {
    return null;
  }

  const usagePercentage = limit > 0 ? Math.round((currentUsage / limit) * 100) : 0;
  const isAtLimit = currentUsage >= limit;

  const getActionText = () => {
    switch (actionType) {
      case 'analyze_pr':
        return 'PRs analyzed';
      case 'scan_repo':
        return 'repos scanned';
      case 'api_call':
        return 'API calls';
      default:
        return 'actions';
    }
  };

  const getUpgradeTier = () => {
    if (currentTier === 'free') return 'pro';
    if (currentTier === 'pro') return 'team';
    return 'enterprise';
  };

  const upgradeTier = getUpgradeTier();

  return (
    <div className={`upgrade-prompt ${isAtLimit ? 'at-limit' : 'near-limit'}`}>
      <div className="upgrade-prompt-content">
        {isAtLimit ? (
          <>
            <h3>🚫 Monthly Limit Reached</h3>
            <p>
              You've used all {limit} {getActionText()} this month. Upgrade to continue using BEAST MODE.
            </p>
          </>
        ) : (
          <>
            <h3>⚠️ Approaching Limit</h3>
            <p>
              You've used {currentUsage} of {limit} {getActionText()} this month ({usagePercentage}%).
              Upgrade for unlimited access.
            </p>
          </>
        )}

        <div className="upgrade-benefits">
          <h4>Upgrade to {upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1)} and get:</h4>
          <ul>
            {upgradeTier === 'pro' && (
              <>
                <li>✅ Unlimited PR analysis</li>
                <li>✅ Advanced AI recommendations</li>
                <li>✅ Historical quality trends</li>
                <li>✅ Custom quality thresholds</li>
                <li>✅ Priority support</li>
              </>
            )}
            {upgradeTier === 'team' && (
              <>
                <li>✅ Everything in Pro</li>
                <li>✅ Team dashboard</li>
                <li>✅ Developer metrics</li>
                <li>✅ Quality leaderboards</li>
                <li>✅ Slack/Discord notifications</li>
                <li>✅ API access</li>
              </>
            )}
            {upgradeTier === 'enterprise' && (
              <>
                <li>✅ Everything in Team</li>
                <li>✅ Unlimited repos</li>
                <li>✅ SSO (SAML, OAuth)</li>
                <li>✅ Custom integrations</li>
                <li>✅ Dedicated support</li>
                <li>✅ SLA guarantees</li>
              </>
            )}
          </ul>
        </div>

        <div className="upgrade-actions">
          <Link
            href={`/pricing?tier=${upgradeTier}`}
            className="btn btn-primary"
            onClick={onUpgrade}
          >
            Upgrade to {upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1)}
          </Link>
          <Link href="/pricing" className="btn btn-secondary">
            View All Plans
          </Link>
        </div>

        {!isAtLimit && (
          <button
            className="upgrade-dismiss"
            onClick={() => setIsVisible(false)}
          >
            Dismiss
          </button>
        )}
      </div>

      <style jsx>{`
        .upgrade-prompt {
          border: 2px solid;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .upgrade-prompt.at-limit {
          border-color: #ef4444;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .upgrade-prompt.near-limit {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .upgrade-prompt-content h3 {
          margin: 0 0 10px 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .upgrade-prompt-content p {
          margin: 0 0 20px 0;
          opacity: 0.95;
        }

        .upgrade-benefits {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }

        .upgrade-benefits h4 {
          margin: 0 0 10px 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .upgrade-benefits ul {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }

        .upgrade-benefits li {
          margin: 8px 0;
          opacity: 0.95;
        }

        .upgrade-actions {
          display: flex;
          gap: 10px;
          margin: 20px 0;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
        }

        .btn-primary {
          background: white;
          color: #667eea;
        }

        .btn-primary:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .upgrade-dismiss {
          background: none;
          border: none;
          color: white;
          opacity: 0.7;
          cursor: pointer;
          font-size: 0.875rem;
          margin-top: 10px;
        }

        .upgrade-dismiss:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
