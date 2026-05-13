import { useState, useRef } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api/apiClient';
import ToastNotification from '../components/ToastNotification';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [savingName, setSavingName] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string>(currentUser?.photoURL || '');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [toast, setToast] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToast(msg);
    setToastVariant(variant);
    setShowToast(true);
  };

  const handleSaveName = async () => {
    if (!currentUser) return;
    if (!displayName.trim()) { showMsg('Username cannot be empty.', 'danger'); return; }
    setSavingName(true);
    try {
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      showMsg('Username updated successfully.');
    } catch {
      showMsg('Failed to update username.', 'danger');
    } finally {
      setSavingName(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoPreview) return;
    setSavingPhoto(true);
    try {
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ photoURL: photoPreview }),
      });
      showMsg('Profile photo updated.');
    } catch {
      showMsg('Failed to update photo.', 'danger');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentUser || !currentUser.email) return;
    if (!currentPassword) { showMsg('Enter your current password.', 'danger'); return; }
    if (!newPassword) { showMsg('New password cannot be empty.', 'danger'); return; }
    if (newPassword !== confirmPassword) { showMsg('Passwords do not match.', 'danger'); return; }
    if (newPassword.length < 6) { showMsg('Password must be at least 6 characters.', 'danger'); return; }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMsg('Password updated successfully.');
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        showMsg('Current password is incorrect.', 'danger');
      } else {
        showMsg('Failed to update password.', 'danger');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setDeletingAccount(true);
    try {
      await apiRequest('/users/account', { method: 'DELETE' });
      await deleteUser(currentUser);
      await signOut();
      navigate('/login');
    } catch {
      showMsg('Failed to delete account. Try signing out and back in first.', 'danger');
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <div className="profile-page__header">
          <h1 className="profile-page__title">Account Settings</h1>
          <p className="profile-page__subtitle">{currentUser?.email}</p>
        </div>

        {/* Photo section */}
        <div className="profile-page__card">
          <div className="profile-page__card-header">
            <span className="profile-page__card-label">Profile Photo</span>
          </div>
          <div className="profile-page__photo-row">
            <div className="profile-page__avatar" onClick={() => fileInputRef.current?.click()}>
              {photoPreview
                ? <img src={photoPreview} alt="avatar" />
                : <span>{(currentUser?.displayName || currentUser?.email || '?')[0].toUpperCase()}</span>
              }
              <div className="profile-page__avatar-overlay"><i className="bi bi-camera-fill" /></div>
            </div>
            <div className="profile-page__photo-actions">
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <button className="btn-ct" onClick={() => fileInputRef.current?.click()}>Choose Photo</button>
              {photoPreview && photoPreview !== (currentUser?.photoURL || '') && (
                <button className="btn-ct" onClick={handleSavePhoto} disabled={savingPhoto}>
                  {savingPhoto ? 'Saving...' : 'Save Photo'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Username section */}
        <div className="profile-page__card">
          <div className="profile-page__card-header">
            <span className="profile-page__card-label">Username</span>
          </div>
          <div className="profile-page__row">
            <div className="profile-page__field">
              <label className="profile-page__field-label">Display Name</label>
              <input
                className="profile-page__input"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
                placeholder="Your display name"
              />
            </div>
            <div className="profile-page__field profile-page__field--email">
              <label className="profile-page__field-label">Email <span className="profile-page__readonly-badge">read-only</span></label>
              <input className="profile-page__input profile-page__input--readonly" type="text" value={currentUser?.email || ''} readOnly />
            </div>
          </div>
          <div className="profile-page__actions">
            <button className="btn-ct" onClick={handleSaveName} disabled={savingName}>
              {savingName ? 'Saving...' : 'Save Username'}
            </button>
          </div>
        </div>

        {/* Password section */}
        <div className="profile-page__card">
          <div className="profile-page__card-header">
            <span className="profile-page__card-label">Change Password</span>
          </div>
          <div className="profile-page__fields">
            <div className="profile-page__field">
              <label className="profile-page__field-label">Current Password <span className="profile-page__required">*</span></label>
              <input className="profile-page__input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            </div>
            <div className="profile-page__field">
              <label className="profile-page__field-label">New Password <span className="profile-page__required">*</span></label>
              <input className="profile-page__input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="profile-page__field">
              <label className="profile-page__field-label">Confirm New Password <span className="profile-page__required">*</span></label>
              <input className="profile-page__input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSavePassword(); }} placeholder="Repeat new password" />
            </div>
          </div>
          <div className="profile-page__actions">
            <button className="btn-ct" onClick={handleSavePassword} disabled={savingPassword}>
              {savingPassword ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="profile-page__card profile-page__card--danger">
          <div className="profile-page__card-header">
            <span className="profile-page__card-label profile-page__card-label--danger">Danger Zone</span>
          </div>
          <p className="profile-page__danger-desc">Permanently delete your account and all associated data. This cannot be undone.</p>
          <button className="btn-ct profile-page__delete-btn" onClick={() => setShowDeleteConfirm(true)} disabled={deletingAccount}>
            {deletingAccount ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        show={showDeleteConfirm}
        message="Are you sure you want to permanently delete your account? All your players and data will be lost."
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ToastNotification message={toast} show={showToast} onClose={() => setShowToast(false)} variant={toastVariant} />
    </div>
  );
};

export default ProfilePage;
