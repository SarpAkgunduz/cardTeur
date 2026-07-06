import { useState } from 'react';
import BackButton from '../components/BackButton';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../contexts/AuthContext';
import { billingApi } from '../services';
import type { BillingInterval, PaidTier } from '../services/api/types';
import { PLAN_LABELS } from '../services/api/types';
import './PricingPage.css';

interface TierCard {
  id: PaidTier | 'free';
  name: string;
  monthly: string;
  annual: string;
  features: string[];
  highlight?: boolean;
}

const TIERS: TierCard[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: '$0',
    annual: '$0',
    features: ['22 player cards', '1 crew', '25 friends', '3 months match history', 'Voting & match organizing'],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthly: '$3',
    annual: '$30',
    features: ['44 player cards', '5 crews', 'Unlimited friends', '1 year match history', 'Full-res images', '1 referral discount'],
    highlight: true,
  },
  {
    id: 'premium_plus',
    name: 'Premium+',
    monthly: '$5',
    annual: '$50',
    features: ['Unlimited cards', 'Unlimited crews', '5 years match history', 'Analytics & voting insights', '6 referral discounts (7v7 squad)'],
  },
];

function detectCountryCode(): string | undefined {
  const locale = navigator.language || '';
  const region = locale.split('-')[1];
  return region ? region.toUpperCase() : undefined;
}

const PricingPage = () => {
  const { plan } = useAuth();
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loadingTier, setLoadingTier] = useState<PaidTier | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleChoose = async (tier: PaidTier) => {
    setLoadingTier(tier);
    try {
      const result = await billingApi.checkout({ tier, interval, countryCode: detectCountryCode() });
      if (result.url) {
        window.location.href = result.url;
      } else {
        setToastMsg('Checkout started. Complete payment in the opened window.');
        setShowToast(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start checkout.';
      setToastMsg(message);
      setShowToast(true);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title">Plans</h2>
          </div>

          <div className="pricing-interval">
            <button
              className={`btn btn-ct ${interval === 'monthly' ? 'active-mode' : ''}`}
              onClick={() => setInterval('monthly')}
            >
              Monthly
            </button>
            <button
              className={`btn btn-ct ${interval === 'annual' ? 'active-mode' : ''}`}
              onClick={() => setInterval('annual')}
            >
              Annual <span className="pricing-interval__save">save ~17%</span>
            </button>
          </div>

          <div className="pricing-grid">
            {TIERS.map((tier) => {
              const isCurrent = plan === tier.id;
              const price = interval === 'annual' ? tier.annual : tier.monthly;
              const suffix = tier.id === 'free' ? '' : interval === 'annual' ? '/yr' : '/mo';
              return (
                <div key={tier.id} className={`pricing-card ${tier.highlight ? 'pricing-card--highlight' : ''}`}>
                  <h3 className="pricing-card__name">{tier.name}</h3>
                  <div className="pricing-card__price">
                    {price}<span className="pricing-card__suffix">{suffix}</span>
                  </div>
                  <ul className="pricing-card__features">
                    {tier.features.map((f) => (
                      <li key={f}><i className="bi bi-check-lg" /> {f}</li>
                    ))}
                  </ul>
                  {tier.id === 'free' ? (
                    <button className="btn btn-ct pricing-card__cta" disabled>
                      {isCurrent ? 'Current plan' : 'Free'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-ct pricing-card__cta"
                      disabled={isCurrent || loadingTier !== null}
                      onClick={() => handleChoose(tier.id as PaidTier)}
                    >
                      {isCurrent ? `Current: ${PLAN_LABELS[plan]}` : loadingTier === tier.id ? 'Starting…' : 'Choose'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="pricing-note">
            First month free on any paid plan. Turkish customers are billed in ₺ via iyzico; everyone else via Paddle.
          </p>
        </div>
      </div>

      <ToastNotification
        show={showToast}
        message={toastMsg}
        onClose={() => setShowToast(false)}
        variant="info"
      />
    </div>
  );
};

export default PricingPage;
