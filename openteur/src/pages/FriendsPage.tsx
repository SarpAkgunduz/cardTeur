import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import ToastNotification from '../components/ToastNotification';
import ConfirmDialog from '../components/ConfirmDialog';
import BackButton from '../components/BackButton';
import './FriendsPage.css';

interface FriendUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface FriendRequestsResponse {
  incoming: FriendUser[];
  outgoing: FriendUser[];
}

const FriendsPage = () => {
  const { currentUser } = useAuth();
  const inviteLink = `${window.location.origin}/invite/${currentUser?.uid}`;

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [copied, setCopied] = useState(false);

  // My Friends tab
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendFilter, setFriendFilter] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [confirmRemoveUid, setConfirmRemoveUid] = useState<string | null>(null);

  // Friend requests tab
  const [incomingRequests, setIncomingRequests] = useState<FriendUser[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendUser[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestActionUid, setRequestActionUid] = useState<string | null>(null);

  // Add Friend tab — exact match only, no DB scan
  const [addQuery, setAddQuery] = useState('');
  const [addResult, setAddResult] = useState<FriendUser | null>(null);
  const [addNotFound, setAddNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);

  const [toast, setToast] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToast(msg); setToastVariant(variant); setShowToast(true);
  };

  const loadFriends = () => {
    setLoadingFriends(true);
    return apiRequest<FriendUser[]>('/users/friends')
      .then(setFriends)
      .catch(() => showMsg('Failed to load friends.', 'danger'))
      .finally(() => setLoadingFriends(false));
  };

  const loadRequests = () => {
    setLoadingRequests(true);
    return apiRequest<FriendRequestsResponse>('/users/friend-requests')
      .then((data) => {
        setIncomingRequests(data.incoming);
        setOutgoingRequests(data.outgoing);
      })
      .catch(() => showMsg('Failed to load friend requests.', 'danger'))
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showMsg('Could not copy link.', 'danger');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Join me on CardTeur! ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Client-side filter on already-loaded friends list
  const filteredFriends = friendFilter.trim()
    ? friends.filter(f =>
        f.displayName.toLowerCase().includes(friendFilter.toLowerCase()) ||
        f.email.toLowerCase().includes(friendFilter.toLowerCase())
      )
    : friends;

  // Exact UID or exact email lookup — single indexed DB hit
  const handleExactSearch = async () => {
    const q = addQuery.trim();
    if (!q) return;
    setSearching(true);
    setAddResult(null);
    setAddNotFound(false);
    try {
      const results = await apiRequest<FriendUser[]>(`/users/search?q=${encodeURIComponent(q)}`);
      if (results.length > 0) {
        setAddResult(results[0]);
      } else {
        setAddNotFound(true);
      }
    } catch {
      showMsg('Search failed.', 'danger');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (user: FriendUser) => {
    setAddingUid(user.uid);
    try {
      await apiRequest(`/users/friends/${user.uid}`, { method: 'POST' });
      setOutgoingRequests(prev => prev.some(request => request.uid === user.uid) ? prev : [...prev, user]);
      setAddResult(null);
      setAddQuery('');
      showMsg(`Friend request sent to ${user.displayName}.`);
    } catch {
      showMsg('Failed to send friend request.', 'danger');
    } finally {
      setAddingUid(null);
    }
  };

  const handleAcceptRequest = async (user: FriendUser) => {
    setRequestActionUid(user.uid);
    try {
      await apiRequest(`/users/friend-requests/${user.uid}/accept`, { method: 'POST' });
      setIncomingRequests(prev => prev.filter(request => request.uid !== user.uid));
      setOutgoingRequests(prev => prev.filter(request => request.uid !== user.uid));
      setFriends(prev => prev.some(friend => friend.uid === user.uid) ? prev : [...prev, user]);
      showMsg(`${user.displayName} added as friend.`);
    } catch {
      showMsg('Failed to accept friend request.', 'danger');
    } finally {
      setRequestActionUid(null);
    }
  };

  const handleRejectRequest = async (user: FriendUser) => {
    setRequestActionUid(user.uid);
    try {
      await apiRequest(`/users/friend-requests/${user.uid}`, { method: 'DELETE' });
      setIncomingRequests(prev => prev.filter(request => request.uid !== user.uid));
      showMsg('Friend request declined.');
    } catch {
      showMsg('Failed to decline friend request.', 'danger');
    } finally {
      setRequestActionUid(null);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!confirmRemoveUid) return;
    setRemovingUid(confirmRemoveUid);
    setConfirmRemoveUid(null);
    try {
      await apiRequest(`/users/friends/${confirmRemoveUid}`, { method: 'DELETE' });
      setFriends(prev => prev.filter(f => f.uid !== confirmRemoveUid));
      showMsg('Friend removed.');
    } catch {
      showMsg('Failed to remove friend.', 'danger');
    } finally {
      setRemovingUid(null);
    }
  };

  const friendUids = new Set(friends.map(f => f.uid));
  const outgoingUids = new Set(outgoingRequests.map(f => f.uid));

  const renderAvatar = (user: FriendUser, size = 40) => (
    <div className="friends-page__avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {user.photoURL
        ? <img src={user.photoURL} alt={user.displayName} />
        : <span>{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
      }
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
    <div className="friends-page">
      <div className="page-header friends-page__header">
        <div className="back-button-container">
          <BackButton position="static" />
        </div>
        <h2 className="page-title friends-page__title">Friends</h2>
        <span className="friends-page__count">{friends.length} friends</span>
      </div>

      {/* Invite section */}
      <div className="friends-page__invite">
        <div className="friends-page__invite-label">
          <i className="bi bi-link-45deg" /> Your invite link
        </div>
        <div className="friends-page__invite-row">
          <span className="friends-page__invite-url">{inviteLink}</span>
          <button className="friends-page__invite-btn" onClick={handleCopyLink} title="Copy link">
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="friends-page__invite-btn friends-page__invite-btn--whatsapp" onClick={handleShareWhatsApp} title="Share on WhatsApp">
            <i className="bi bi-whatsapp" /> WhatsApp
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="friends-page__tabs">
        <button
          className={`friends-page__tab ${activeTab === 'friends' ? 'friends-page__tab--active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <i className="bi bi-people-fill" /> My Friends
        </button>
        <button
          className={`friends-page__tab ${activeTab === 'requests' ? 'friends-page__tab--active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <i className="bi bi-inbox-fill" /> Requests
          {incomingRequests.length > 0 && <span className="friends-page__tab-badge">{incomingRequests.length}</span>}
        </button>
        <button
          className={`friends-page__tab ${activeTab === 'add' ? 'friends-page__tab--active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <i className="bi bi-person-plus-fill" /> Add Friend
        </button>
      </div>

      {/* ── Tab: My Friends ── */}
      {activeTab === 'friends' && (
        <>
          <div className="friends-page__search-wrap">
            <i className="bi bi-search friends-page__search-icon" />
            <input
              className="friends-page__search-input"
              type="text"
              placeholder="Filter your friends..."
              value={friendFilter}
              onChange={e => setFriendFilter(e.target.value)}
            />
          </div>

          <div className="friends-page__section">
            {loadingFriends ? (
              <div className="friends-page__loading"><div className="spinner-border text-info" role="status" /></div>
            ) : filteredFriends.length === 0 ? (
              <div className="friends-page__empty">
                {friends.length === 0
                  ? 'No friends yet. Use the "Add Friend" tab to find people.'
                  : 'No friends match your filter.'}
              </div>
            ) : (
              <div className="friends-page__list">
                {filteredFriends.map((friend, i) => (
                  <div className="friends-page__row" key={friend.uid} style={{ animationDelay: `${i * 0.04}s` }}>
                    {renderAvatar(friend)}
                    <div className="friends-page__info">
                      <span className="friends-page__name">{friend.displayName}</span>
                      <span className="friends-page__email">{friend.email}</span>
                    </div>
                    <button
                      className="friends-page__action-btn friends-page__action-btn--remove"
                      onClick={() => setConfirmRemoveUid(friend.uid)}
                      disabled={removingUid === friend.uid}
                      title="Remove friend"
                    >
                      {removingUid === friend.uid
                        ? <span className="spinner-border spinner-border-sm" />
                        : <i className="bi bi-person-dash-fill" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Tab: Requests ── */}
      {activeTab === 'requests' && (
        <div className="friends-page__section">
          <div className="friends-page__section-label">Incoming requests</div>
          {loadingRequests ? (
            <div className="friends-page__loading"><div className="spinner-border text-info" role="status" /></div>
          ) : incomingRequests.length === 0 ? (
            <div className="friends-page__empty">No incoming friend requests.</div>
          ) : (
            <div className="friends-page__list">
              {incomingRequests.map((request, i) => (
                <div className="friends-page__row" key={request.uid} style={{ animationDelay: `${i * 0.04}s` }}>
                  {renderAvatar(request)}
                  <div className="friends-page__info">
                    <span className="friends-page__name">{request.displayName}</span>
                    <span className="friends-page__email">{request.email}</span>
                  </div>
                  <div className="friends-page__request-actions">
                    <button
                      className="friends-page__action-btn friends-page__action-btn--add"
                      onClick={() => handleAcceptRequest(request)}
                      disabled={requestActionUid === request.uid}
                      title="Accept request"
                    >
                      {requestActionUid === request.uid
                        ? <span className="spinner-border spinner-border-sm" />
                        : <><i className="bi bi-check-lg" /> Accept</>
                      }
                    </button>
                    <button
                      className="friends-page__action-btn friends-page__action-btn--remove"
                      onClick={() => handleRejectRequest(request)}
                      disabled={requestActionUid === request.uid}
                      title="Decline request"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="friends-page__section-label friends-page__section-label--spaced">Sent requests</div>
          {loadingRequests ? null : outgoingRequests.length === 0 ? (
            <div className="friends-page__empty friends-page__empty--compact">No sent requests.</div>
          ) : (
            <div className="friends-page__list">
              {outgoingRequests.map((request, i) => (
                <div className="friends-page__row" key={request.uid} style={{ animationDelay: `${i * 0.04}s` }}>
                  {renderAvatar(request)}
                  <div className="friends-page__info">
                    <span className="friends-page__name">{request.displayName}</span>
                    <span className="friends-page__email">{request.email}</span>
                  </div>
                  <span className="friends-page__already-badge">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Add Friend ── */}
      {activeTab === 'add' && (
        <div className="friends-page__add-panel">
          <p className="friends-page__add-hint">
            Enter an exact <strong>user ID</strong> or <strong>email address</strong> to find someone.
            Users can find their ID in Account Settings.
          </p>
          <div className="friends-page__add-row">
            <div className="friends-page__search-wrap friends-page__search-wrap--grow">
              <i className="bi bi-search friends-page__search-icon" />
              <input
                className="friends-page__search-input"
                type="text"
                placeholder="Exact user ID or email..."
                value={addQuery}
                onChange={e => { setAddQuery(e.target.value); setAddResult(null); setAddNotFound(false); }}
                onKeyDown={e => { if (e.key === 'Enter') handleExactSearch(); }}
              />
            </div>
            <button
              className="friends-page__add-search-btn"
              onClick={handleExactSearch}
              disabled={searching || !addQuery.trim()}
            >
              {searching ? <span className="spinner-border spinner-border-sm" /> : 'Search'}
            </button>
          </div>

          {addNotFound && (
            <div className="friends-page__add-notfound">
              <i className="bi bi-person-x" /> No user found. Make sure you entered the exact ID or email.
            </div>
          )}

          {addResult && (
            <div className="friends-page__row friends-page__row--result">
              {renderAvatar(addResult, 44)}
              <div className="friends-page__info">
                <span className="friends-page__name">{addResult.displayName}</span>
                <span className="friends-page__email">{addResult.email}</span>
              </div>
              {friendUids.has(addResult.uid) ? (
                <span className="friends-page__already-badge">Already friends</span>
              ) : outgoingUids.has(addResult.uid) ? (
                <span className="friends-page__already-badge">Request sent</span>
              ) : (
                <button
                  className="friends-page__action-btn friends-page__action-btn--add"
                  onClick={() => handleAdd(addResult!)}
                  disabled={addingUid === addResult.uid}
                >
                  {addingUid === addResult.uid
                    ? <span className="spinner-border spinner-border-sm" />
                    : <><i className="bi bi-person-plus-fill" /> Add</>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        show={!!confirmRemoveUid}
        message={`Remove "${friends.find(f => f.uid === confirmRemoveUid)?.displayName}" from your friends?`}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmRemoveUid(null)}
      />

      <ToastNotification show={showToast} message={toast} variant={toastVariant} onClose={() => setShowToast(false)} />
    </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
