import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { userApi } from '../../services/api/userApi';
import type { AppUser } from '../../services/api/types';

type Tab = 'my-friends' | 'add-friend';

export default function FriendsScreen() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('my-friends');
  const [myUser, setMyUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<AppUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' });

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant });
  };

  useEffect(() => {
    userApi.getMe()
      .then(setMyUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myFriends = (myUser?.friends ?? []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const results = await userApi.search(searchQuery.trim());
      const found = results.find(u => u.uid !== currentUser?.uid);
      if (found) {
        setSearchResult(found);
      } else {
        setSearchError('No user found with that email or UID.');
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (uid: string) => {
    try {
      await userApi.addFriend(uid);
      setMyUser(prev => prev ? { ...prev, friends: [...prev.friends, uid] } : prev);
      setSearchResult(null);
      setSearchQuery('');
      showToast('Friend added!');
    } catch {
      showToast('Failed to add friend.', 'error');
    }
  };

  const handleRemoveFriend = (uid: string, name: string) => {
    Alert.alert('Remove Friend', `Remove ${name} from your friends?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.removeFriend(uid);
            setMyUser(prev => prev ? { ...prev, friends: prev.friends.filter(f => f !== uid) } : prev);
            showToast('Friend removed.');
          } catch {
            showToast('Failed to remove friend.', 'error');
          }
        },
      },
    ]);
  };

  const isAlreadyFriend = (uid: string) => myFriends.includes(uid);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Friends" />

      <View style={styles.tabs}>
        {(['my-friends', 'add-friend'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'my-friends' ? `My Friends (${myFriends.length})` : 'Add Friend'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      )}

      {!loading && activeTab === 'my-friends' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {myFriends.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptyHint}>Use the Add Friend tab to find people</Text>
            </View>
          ) : (
            myFriends.map(uid => (
              <View key={uid} style={styles.friendRow}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>?</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendUid} numberOfLines={1}>{uid}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveFriend(uid, uid)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {!loading && activeTab === 'add-friend' && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.searchLabel}>Search by exact UID or email</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Email or UID"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching
                ? <ActivityIndicator size="small" color={Colors.background} />
                : <Text style={styles.searchBtnText}>Search</Text>
              }
            </TouchableOpacity>
          </View>

          {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}

          {searchResult && (
            <View style={styles.searchResultCard}>
              <View style={styles.friendAvatar}>
                {searchResult.photoURL
                  ? <Image source={{ uri: searchResult.photoURL }} style={styles.friendAvatarImage} />
                  : <Text style={styles.friendAvatarText}>{(searchResult.displayName || searchResult.email)[0]?.toUpperCase()}</Text>
                }
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendUid}>{searchResult.displayName || '—'}</Text>
                <Text style={styles.friendEmail}>{searchResult.email}</Text>
              </View>
              {isAlreadyFriend(searchResult.uid) ? (
                <View style={styles.alreadyFriendBadge}>
                  <Text style={styles.alreadyFriendText}>Added</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddFriend(searchResult.uid)}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabTextActive: { color: Colors.accent },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, textTransform: 'uppercase', letterSpacing: 1 },
  emptyHint: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: Spacing.xs, opacity: 0.6 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    overflow: 'hidden',
  },
  friendAvatarImage: { width: 36, height: 36 },
  friendAvatarText: { color: Colors.accent, fontWeight: '700', fontSize: FontSizes.sm },
  friendInfo: { flex: 1 },
  friendUid: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  friendEmail: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  removeBtn: {
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  removeBtnText: { color: Colors.error, fontSize: FontSizes.xs, fontWeight: '700' },
  searchLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
  },
  searchBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  searchBtnText: {
    color: Colors.background,
    fontWeight: '800',
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchError: { color: Colors.error, fontSize: FontSizes.sm, marginBottom: Spacing.sm },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  alreadyFriendBadge: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  alreadyFriendText: { color: Colors.accent, fontSize: FontSizes.xs, fontWeight: '700' },
  addBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  addBtnText: { color: Colors.background, fontWeight: '800', fontSize: FontSizes.xs, textTransform: 'uppercase' },
});
