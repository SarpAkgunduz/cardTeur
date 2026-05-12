import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api/apiClient';
import ToastNotification from '../components/ToastNotification';
import ConfirmDialog from '../components/ConfirmDialog';
import './UsersPage.css';

interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  provider: string;
}

const UsersPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToast(msg);
    setToastVariant(variant);
    setShowToast(true);
  };

  useEffect(() => {
    apiRequest<FirebaseUser[]>('/users')
      .then((data) => setUsers(data))
      .catch(() => showMsg('Failed to load users.', 'danger'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteConfirm = async () => {
    if (!confirmUid) return;
    setDeletingUid(confirmUid);
    setConfirmUid(null);
    try {
      await apiRequest(`/users/${confirmUid}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.uid !== confirmUid));
      showMsg('User deleted successfully.');
    } catch {
      showMsg('Failed to delete user.', 'danger');
    } finally {
      setDeletingUid(null);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const providerIcon = (provider: string) => {
    if (provider === 'google.com') return <i className="bi bi-google users-page__provider-icon users-page__provider-icon--google" />;
    return <i className="bi bi-envelope-fill users-page__provider-icon" />;
  };

  return (
    <div className="users-page">
      <div className="users-page__header">
        <h2 className="users-page__title">User Management</h2>
        <span className="users-page__count">{users.length} users</span>
      </div>

      {loading ? (
        <div className="users-page__loading">
          <div className="spinner-border text-info" role="status" />
        </div>
      ) : users.length === 0 ? (
        <div className="users-page__empty">No users found.</div>
      ) : (
        <div className="users-page__list">
          {users.map((user, i) => (
            <div
              className="users-page__row"
              key={user.uid}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="users-page__avatar">
                {(user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
              </div>
              <div className="users-page__info">
                <span className="users-page__name">
                  {user.displayName}
                  {user.uid === currentUser?.uid && (
                    <span className="users-page__you-badge">you</span>
                  )}
                </span>
                <span className="users-page__email">{user.email}</span>
              </div>
              <div className="users-page__meta">
                {providerIcon(user.provider)}
                <span className="users-page__date">{formatDate(user.createdAt)}</span>
              </div>
              <button
                className="users-page__delete-btn"
                onClick={() => setConfirmUid(user.uid)}
                disabled={deletingUid === user.uid || user.uid === currentUser?.uid}
                title={user.uid === currentUser?.uid ? "You can't delete your own account here" : 'Delete user'}
              >
                {deletingUid === user.uid ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <i className="bi bi-trash3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        show={!!confirmUid}
        message={`Are you sure you want to delete "${users.find((u) => u.uid === confirmUid)?.email}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmUid(null)}
      />

      <ToastNotification
        show={showToast}
        message={toast}
        variant={toastVariant}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default UsersPage;
