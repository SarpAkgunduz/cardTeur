import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../contexts/AuthContext';
import { referralApi } from '../services';
import type { ReferralOverview } from '../services/api/types';
import './ReferralsPage.css';

const ReferralsPage = () => {
  const { plan } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const load = async () => {
    try {
      const data = await referralApi.getOverview();
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await referralApi.generate();
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create a referral.';
      setToastMsg(message);
      setShowToast(true);
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    setToastMsg('Referral link copied.');
    setShowToast(true);
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title">Referrals</h2>
          </div>

          {plan === 'free' ? (
            <div className="referrals-empty">
              <p>Referral discounts are a Premium feature.</p>
              <p className="referrals-empty__sub">
                Premium gives 1 referral slot, Premium+ gives 6 — enough for a full 7v7 squad. Each friend gets 50% off
                their first month, and you earn a free month when they subscribe.
              </p>
              <button className="btn btn-ct" onClick={() => navigate('/pricing')}>See plans</button>
            </div>
          ) : loading ? (
            <p className="referrals-loading">Loading…</p>
          ) : overview ? (
            <>
              <div className="referrals-summary">
                <span><strong>{overview.available}</strong> of {overview.slots} slots available</span>
                <button
                  className="btn btn-ct"
                  onClick={handleGenerate}
                  disabled={generating || overview.available <= 0}
                >
                  {generating ? 'Creating…' : 'Create referral'}
                </button>
              </div>

              <div className="referrals-list">
                {overview.referrals.length === 0 ? (
                  <p className="referrals-loading">No referrals yet. Create one to invite a friend.</p>
                ) : overview.referrals.map((r) => (
                  <div key={r._id} className={`referral-row referral-row--${r.status}`}>
                    <span className="referral-row__code">{r.code}</span>
                    <span className="referral-row__status">
                      {r.status === 'redeemed' ? (r.rewardGranted ? 'Redeemed · reward earned' : 'Redeemed') : 'Unused'}
                    </span>
                    {r.status === 'unused' && (
                      <button className="btn btn-ct referral-row__copy" onClick={() => copyLink(r.code)}>
                        <i className="bi bi-clipboard" style={{ marginRight: 6 }} />Copy link
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="referrals-loading">Could not load referrals.</p>
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

export default ReferralsPage;
