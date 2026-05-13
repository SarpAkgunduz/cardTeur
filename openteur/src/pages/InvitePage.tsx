import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api/apiClient';

const InvitePage = () => {
  const { inviterUid } = useParams<{ inviterUid: string }>();
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>('pending');

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      // Redirect to login, come back after
      navigate(`/login?redirect=/invite/${inviterUid}`);
      return;
    }

    if (!inviterUid || inviterUid === currentUser.uid) {
      navigate('/friends');
      return;
    }

    apiRequest(`/users/friends/${inviterUid}`, { method: 'POST' })
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [currentUser, loading, inviterUid, navigate]);

  useEffect(() => {
    if (status === 'done') {
      const t = setTimeout(() => navigate('/friends'), 2000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 16, color: '#fff',
    }}>
      {status === 'pending' && <div className="spinner-border text-info" role="status" />}
      {status === 'done' && (
        <>
          <i className="bi bi-person-check-fill" style={{ fontSize: '3rem', color: '#00deec' }} />
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Friend added! Redirecting...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <i className="bi bi-exclamation-circle" style={{ fontSize: '3rem', color: '#ff6b6b' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Something went wrong. You may already be friends.</p>
          <button className="btn-ct" onClick={() => navigate('/friends')}>Go to Friends</button>
        </>
      )}
    </div>
  );
};

export default InvitePage;
