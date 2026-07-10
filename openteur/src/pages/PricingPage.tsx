import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../contexts/AuthContext';
import { billingApi } from '../services';
import type { BillingInterval, PaidTier, Plan } from '../services/api/types';
import './PricingPage.css';

interface TierCard {
  id: PaidTier | 'free';
  name: string;
  monthly: string;
  annual: string;
  features: string[];
  highlight?: boolean;
}

function detectCountryCode(): string | undefined {
  const locale = navigator.language || '';
  const region = locale.split('-')[1];
  return region ? region.toUpperCase() : undefined;
}

const PricingPage = () => {
  const { t } = useTranslation();
  const { plan } = useAuth();
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loadingTier, setLoadingTier] = useState<PaidTier | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const planNames: Record<Plan, string> = {
    free: t('pricing.freeName'),
    premium: t('pricing.premiumName'),
    premium_plus: t('pricing.premiumPlusName'),
  };

  const TIERS: TierCard[] = [
    {
      id: 'free',
      name: t('pricing.freeName'),
      monthly: '$0',
      annual: '$0',
      features: [
        t('pricing.freeFeature1'),
        t('pricing.freeFeature2'),
        t('pricing.freeFeature3'),
        t('pricing.freeFeature4'),
        t('pricing.freeFeature5'),
      ],
    },
    {
      id: 'premium',
      name: t('pricing.premiumName'),
      monthly: '$3',
      annual: '$30',
      features: [
        t('pricing.premiumFeature1'),
        t('pricing.premiumFeature2'),
        t('pricing.premiumFeature3'),
        t('pricing.premiumFeature4'),
        t('pricing.premiumFeature5'),
        t('pricing.premiumFeature6'),
      ],
      highlight: true,
    },
    {
      id: 'premium_plus',
      name: t('pricing.premiumPlusName'),
      monthly: '$5',
      annual: '$50',
      features: [
        t('pricing.premiumPlusFeature1'),
        t('pricing.premiumPlusFeature2'),
        t('pricing.premiumPlusFeature3'),
        t('pricing.premiumPlusFeature4'),
        t('pricing.premiumPlusFeature5'),
      ],
    },
  ];

  const handleChoose = async (tier: PaidTier) => {
    setLoadingTier(tier);
    try {
      const result = await billingApi.checkout({ tier, interval, countryCode: detectCountryCode() });
      if (result.url) {
        window.location.href = result.url;
      } else {
        setToastMsg(t('pricing.checkoutStarted'));
        setShowToast(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('pricing.checkoutFailed');
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
            <h2 className="page-title">{t('pricing.title')}</h2>
          </div>

          <div className="pricing-interval">
            <button
              className={`btn btn-ct ${interval === 'monthly' ? 'active-mode' : ''}`}
              onClick={() => setInterval('monthly')}
            >
              {t('pricing.monthly')}
            </button>
            <button
              className={`btn btn-ct ${interval === 'annual' ? 'active-mode' : ''}`}
              onClick={() => setInterval('annual')}
            >
              {t('pricing.annual')} <span className="pricing-interval__save">{t('pricing.annualSave')}</span>
            </button>
          </div>

          <div className="pricing-grid">
            {TIERS.map((tier) => {
              const isCurrent = plan === tier.id;
              const price = interval === 'annual' ? tier.annual : tier.monthly;
              const suffix = tier.id === 'free' ? '' : interval === 'annual' ? t('pricing.perYear') : t('pricing.perMonth');
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
                      {isCurrent ? t('pricing.currentPlan') : t('pricing.freeName')}
                    </button>
                  ) : (
                    <button
                      className="btn btn-ct pricing-card__cta"
                      disabled={isCurrent || loadingTier !== null}
                      onClick={() => handleChoose(tier.id as PaidTier)}
                    >
                      {isCurrent ? t('pricing.current', { plan: planNames[plan] }) : loadingTier === tier.id ? t('pricing.starting') : t('pricing.choose')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="pricing-note">
            {t('pricing.note')}
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
