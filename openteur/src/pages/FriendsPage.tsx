import { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../services/api/apiClient';
import ToastNotification from '../components/ToastNotification';
import ConfirmDialog from '../components/ConfirmDialog';
import './FriendsPage.css';

interface FriendUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

const FriendsPage = () => {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [confirmRemoveUid, setConfirmRemoveUid] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToast(msg); setToastVariant(variant); setShowToast(true);
  };

  useEffect(() => {
    apiRequest<FriendUser[]>('/users/friends')
      .then(setFriends)
      .catch(() => showMsg('Failed to load friends.', 'danger'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await apiRequest<FriendUser[]>(`/users/search?q=${encodeURIComponent(q.trim())}`);
        setSearchResults(results);
      } catch {
        showMsg('Search failed.', 'danger');
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleAdd = async (user: FriendUser) => {
    setAddingUid(user.uid);
    try {
      await apiRequest(`/users/friends/${user.uid}`, { method: 'POST' });
      setFriends(prev => [...prev, user]);
      setSearchResults(prev => prev.filter(u => u.uid !== user.uid));
      showMsg(`${user.displayName} added as friend.`);
    } catch {
      showMsg('Failed to add friend.', 'danger');
    } finally {
      setAddingUid(null);
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

  const renderAvatar = (user: FriendUser, size = 40) => (
    <div className="friends-page__avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {user.photoURL
        ? <img src={user.photoURL} alt={user.displayName} />
        : <span>{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
      }
    </div>
  );

  return (
    <div className="friends-page">
      <div className="friends-page__header">
        <h2 className="friends-page__title">Friends</h2>
        <span className="friends-page__count">{friends.length} friends</span>
      </div>

      {/* Search */}
      <div className="friends-page__search-wrap">
        <i className="bi bi-search friends-page__search-icon" />
        <input
          className="friends-page__search-input"
          type="text"
          placeholder="Search by name or email..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
        />
        {searching && <span className="spinner-border spinner-border-sm friends-page__search-spinner" />}
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="friends-page__section">
          <div className="friends-page__section-label">Search Results</div>
          <div className="friends-page__list">
            {searchResults.map(user => (
              <div className="friends-page__row" key={user.uid}>
                {renderAvatar(user)}
                <div className="friends-page__info">
                  <span className="friends-page__name">{user.displayName}</span>
                  <span className="friends-page__email">{user.email}</span>
                </div>
                {friendUids.has(user.uid) ? (
                  <span className="friends-page__already-badge">Already friends</span>
                ) : (
                  <button
                    className="friends-page__action-btn friends-page__action-btn--add"
                    onClick={() => handleAdd(user)}
                    disabled={addingUid === user.uid}
                  >
                    {addingUid === user.uid
                      ? <span className="spinner-border spinner-border-sm" />
                      : <><i className="bi bi-person-plus-fill" /> Add</>
                    }
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="friends-page__section">
        {friends.length > 0 && <div className="friends-page__section-label">Your Friends</div>}
        {loading ? (
          <div className="friends-page__loading"><div className="spinner-border text-info" role="status" /></div>
        ) : friends.length === 0 ? (
          <div className="friends-page__empty">No friends yet. Search for users above to add them.</div>
        ) : (
          <div className="friends-page__list">
            {friends.map((friend, i) => (
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

      <ConfirmDialog
        show={!!confirmRemoveUid}
        message={`Remove "${friends.find(f => f.uid === confirmRemoveUid)?.displayName}" from your friends?`}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmRemoveUid(null)}
      />

      <ToastNotification show={showToast} message={toast} variant={toastVariant} onClose={() => setShowToast(false)} />
    </div>
  );
};

export default FriendsPage;
