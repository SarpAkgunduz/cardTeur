import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../contexts/AuthContext';
import { billingApi, referralApi } from '../services';
import type { BillingInterval, PaidTier, Plan, ReferralOverview } from '../services/api/types';
import { getPaddle } from '../services/paddle';
import './PricingPage.css';

const REFERRAL_STORAGE_KEY = 'ct_referral_code';

type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'AUD' | 'CNY' | 'JPY';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  AUD: 'AUD $',
  CNY: 'CN¥',
  JPY: '¥',
};

// Mirrors the unit_price_overrides configured on the Paddle prices — UK/Ireland/
// Australia/China/Japan get a local-currency price, everyone else falls back to
// the USD base.
function currencyForCountry(countryCode?: string): CurrencyCode {
  switch (countryCode) {
    case 'GB': return 'GBP';
    case 'IE': return 'EUR';
    case 'AU': return 'AUD';
    case 'CN': return 'CNY';
    case 'JP': return 'JPY';
    default: return 'USD';
  }
}

const PRICES: Record<PaidTier, Record<CurrencyCode, { monthly: number; annual: number }>> = {
  premium: {
    USD: { monthly: 3, annual: 30 },
    GBP: { monthly: 3, annual: 30 },
    EUR: { monthly: 3, annual: 30 },
    AUD: { monthly: 5, annual: 50 },
    CNY: { monthly: 20, annual: 200 },
    JPY: { monthly: 450, annual: 4500 },
  },
  premium_plus: {
    USD: { monthly: 5, annual: 50 },
    GBP: { monthly: 5, annual: 50 },
    EUR: { monthly: 5, annual: 50 },
    AUD: { monthly: 8, annual: 80 },
    CNY: { monthly: 35, annual: 350 },
    JPY: { monthly: 750, annual: 7500 },
  },
};

interface TierCard {
  id: PaidTier | 'free';
  name: string;
  monthly: string;
  annual: string;
  features: string[];
  highlight?: boolean;
}

// Best-effort guess from the browser locale, used to preview local pricing here.
// The real charge is decided by Paddle's own checkout-time geolocation, which is
// more reliable — this is a preview, not a guarantee of the final currency.
function detectCountryCode(): string | undefined {
  const locale = navigator.language || '';
  const region = locale.split('-')[1];
  return region ? region.toUpperCase() : undefined;
}

const PricingPage = () => {
  const { t } = useTranslation();
  const { plan } = useAuth();
  const [view, setView] = useState<'plans' | 'referrals'>('plans');
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loadingTier, setLoadingTier] = useState<PaidTier | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [referralOverview, setReferralOverview] = useState<ReferralOverview | null>(null);
  const [referralOverviewLoading, setReferralOverviewLoading] = useState(true);
  const [generatingReferral, setGeneratingReferral] = useState(false);

  const checkReferral = async (code: string) => {
    if (!code) {
      setReferralStatus('idle');
      return;
    }
    setReferralStatus('checking');
    try {
      const result = await referralApi.validate(code);
      setReferralStatus(result.valid ? 'valid' : 'invalid');
    } catch {
      setReferralStatus('invalid');
    }
  };

  // Auto-apply a code captured on signup (?ref=CODE stored by SignupPage)
  useEffect(() => {
    const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (stored) {
      setReferralInput(stored);
      checkReferral(stored);
    }
  }, []);

  const loadReferralOverview = () => {
    setReferralOverviewLoading(true);
    referralApi.getOverview()
      .then(setReferralOverview)
      .catch(() => setReferralOverview(null))
      .finally(() => setReferralOverviewLoading(false));
  };

  useEffect(() => {
    if (plan !== 'free') loadReferralOverview();
    else setReferralOverviewLoading(false);
  }, [plan]);

  const handleGenerateReferral = async () => {
    setGeneratingReferral(true);
    try {
      await referralApi.generate();
      loadReferralOverview();
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : t('pricing.referralGenerateFailed'));
      setShowToast(true);
    } finally {
      setGeneratingReferral(false);
    }
  };

  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    setToastMsg(t('pricing.referralLinkCopied'));
    setShowToast(true);
  };

  const planNames: Record<Plan, string> = {
    free: t('pricing.freeName'),
    premium: t('pricing.premiumName'),
    premium_plus: t('pricing.premiumPlusName'),
  };

  const countryCode = detectCountryCode();
  const currency = currencyForCountry(countryCode);
  const symbol = CURRENCY_SYMBOLS[currency];

  const TIERS: TierCard[] = [
    {
      id: 'free',
      name: t('pricing.freeName'),
      monthly: `${symbol}0`,
      annual: `${symbol}0`,
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
      monthly: `${symbol}${PRICES.premium[currency].monthly}`,
      annual: `${symbol}${PRICES.premium[currency].annual}`,
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
      monthly: `${symbol}${PRICES.premium_plus[currency].monthly}`,
      annual: `${symbol}${PRICES.premium_plus[currency].annual}`,
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
      const referralCode = referralStatus === 'valid' ? referralInput : undefined;
      const result = await billingApi.checkout({ tier, interval, countryCode, referralCode });
      if (result.provider === 'paddle' && result.token) {
        const paddle = await getPaddle();
        if (!paddle) {
          setToastMsg(t('pricing.checkoutFailed'));
          setShowToast(true);
          return;
        }
        paddle.Checkout.open({
          transactionId: result.token,
          settings: {
            displayMode: 'overlay',
            variant: 'one-page',
            successUrl: `${window.location.origin}/thank-you`,
          },
        });
      } else if (result.url) {
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

  // Already on a paid plan and picking a different paid tier: change the existing
  // subscription's price in place instead of starting a second, parallel checkout —
  // starting a new checkout here would leave the customer paying for two plans at
  // once (see server/routes/billing.ts's /change-plan route).
  const handleChangePlan = async (tier: PaidTier) => {
    setLoadingTier(tier);
    try {
      await billingApi.changePlan({ tier, interval });
      setToastMsg(t('pricing.planChanged'));
      setShowToast(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('pricing.planChangeFailed');
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

          <div className="pricing-view-tabs">
            <button
              className={`btn btn-ct ${view === 'plans' ? 'active-mode' : ''}`}
              onClick={() => setView('plans')}
            >
              {t('pricing.plansTab')}
            </button>
            <button
              className={`btn btn-ct ${view === 'referrals' ? 'active-mode' : ''}`}
              onClick={() => setView('referrals')}
            >
              {t('pricing.referralsTab')}
            </button>
          </div>

          {view === 'plans' && (
            <>
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

              <div className="pricing-referral">
                <input
                  type="text"
                  className="pricing-referral__input"
                  placeholder={t('pricing.referralPlaceholder')}
                  value={referralInput}
                  onChange={(e) => {
                    setReferralInput(e.target.value.toUpperCase());
                    setReferralStatus('idle');
                  }}
                />
                <button
                  type="button"
                  className="btn btn-ct"
                  disabled={!referralInput || referralStatus === 'checking'}
                  onClick={() => checkReferral(referralInput)}
                >
                  {t('pricing.referralApply')}
                </button>
                {referralStatus === 'valid' && (
                  <span className="pricing-referral__status pricing-referral__status--valid">
                    <i className="bi bi-check-circle-fill" /> {t('pricing.referralValid')}
                  </span>
                )}
                {referralStatus === 'invalid' && (
                  <span className="pricing-referral__status pricing-referral__status--invalid">
                    <i className="bi bi-x-circle-fill" /> {t('pricing.referralInvalid')}
                  </span>
                )}
              </div>

              <div className="pricing-grid">
                {TIERS.map((tier) => {
                  const isCurrent = plan === tier.id;
                  const price = interval === 'annual' ? tier.annual : tier.monthly;
                  const suffix = tier.id === 'free' ? '' : interval === 'annual' ? t('pricing.perYear') : t('pricing.perMonth');
                  // Already paying for some plan and looking at a different paid tier:
                  // this is an upgrade/downgrade of the existing subscription, not a
                  // fresh checkout.
                  const isPlanChange = tier.id !== 'free' && plan !== 'free' && !isCurrent;
                  const isUpgrade = isPlanChange && tier.id === 'premium_plus' && plan === 'premium';
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
                          onClick={() => (isPlanChange ? handleChangePlan(tier.id as PaidTier) : handleChoose(tier.id as PaidTier))}
                        >
                          {isCurrent
                            ? t('pricing.current', { plan: planNames[plan] })
                            : loadingTier === tier.id
                            ? (isPlanChange ? t('pricing.changingPlan') : t('pricing.starting'))
                            : isPlanChange
                            ? (isUpgrade ? t('pricing.upgrade') : t('pricing.downgrade'))
                            : t('pricing.choose')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="pricing-note">
                {t('pricing.note')}
              </p>
            </>
          )}

          {view === 'referrals' && (
            <>
              {plan === 'free' ? (
                <div className="referrals-empty">
                  <p>{t('pricing.referralsFreeTitle')}</p>
                  <p className="referrals-empty__sub">{t('pricing.referralsFreeHint')}</p>
                </div>
              ) : referralOverviewLoading ? (
                <p className="referrals-loading">{t('pricing.referralsLoading')}</p>
              ) : referralOverview ? (
                <>
                  <div className="referrals-summary">
                    <span>
                      {t('pricing.referralSlots', { available: referralOverview.available, slots: referralOverview.slots })}
                    </span>
                    <button
                      className="btn btn-ct"
                      onClick={handleGenerateReferral}
                      disabled={generatingReferral || referralOverview.available <= 0}
                    >
                      {generatingReferral ? t('pricing.creatingReferral') : t('pricing.createReferral')}
                    </button>
                  </div>

                  <div className="referrals-list">
                    {referralOverview.referrals.length === 0 ? (
                      <p className="referrals-loading">{t('pricing.noReferrals')}</p>
                    ) : referralOverview.referrals.map((r) => (
                      <div key={r._id} className={`referral-row referral-row--${r.status}`}>
                        <span className="referral-row__code">{r.code}</span>
                        <span className="referral-row__status">
                          {r.status === 'redeemed'
                            ? (r.rewardGranted ? t('pricing.referralRedeemedRewarded') : t('pricing.referralRedeemed'))
                            : t('pricing.referralUnused')}
                        </span>
                        {r.status === 'unused' && (
                          <button className="btn btn-ct referral-row__copy" onClick={() => copyReferralLink(r.code)}>
                            <i className="bi bi-clipboard" style={{ marginRight: 6 }} />{t('pricing.copyLink')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="referrals-loading">{t('pricing.referralsLoadFailed')}</p>
              )}
            </>
          )}
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
