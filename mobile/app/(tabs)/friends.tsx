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
  Share,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTutorial } from '../../contexts/TutorialContext';
import ScreenHeader from '../../components/ScreenHeader';
import Toast from '../../components/Toast';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { userApi } from '../../services/api/userApi';
import { referralApi } from '../../services/api/referralApi';
import type { AppUser, ReferralOverview } from '../../services/api/types';

type Tab = 'my-friends' | 'add-friend' | 'referrals';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { registerTarget } = useTutorial();
  const { currentUser, plan } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('my-friends');
  const [myUser, setMyUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<AppUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' });
  const [referralOverview, setReferralOverview] = useState<ReferralOverview | null>(null);
  const [referralLoading, setReferralLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant });
  };

  useEffect(() => {
    userApi.getMe()
      .then(setMyUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadReferrals = () => {
    setReferralLoading(true);
    referralApi.getOverview()
      .then(setReferralOverview)
      .catch(() => setReferralOverview(null))
      .finally(() => setReferralLoading(false));
  };

  useEffect(() => {
    if (plan !== 'free') loadReferrals();
    else setReferralLoading(false);
  }, [plan]);

  const handleGenerateReferral = async () => {
    setGenerating(true);
    try {
      await referralApi.generate();
      loadReferrals();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('friends.referralGenerateFailed'), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const shareReferralLink = async (code: string) => {
    const link = `https://cardteur.com/signup?ref=${code}`;
    try {
      await Share.share({ message: link });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

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
        setSearchError(t('friends.searchNotFound'));
      }
    } catch {
      setSearchError(t('friends.searchFailed'));
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
      showToast(t('friends.addedToast'));
    } catch {
      showToast(t('friends.addFailedToast'), 'error');
    }
  };

  const handleRemoveFriend = (uid: string, name: string) => {
    Alert.alert(t('friends.removeTitle'), t('friends.removeConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.removeFriend(uid);
            setMyUser(prev => prev ? { ...prev, friends: prev.friends.filter(f => f !== uid) } : prev);
            showToast(t('friends.removedToast'));
          } catch {
            showToast(t('friends.removeFailedToast'), 'error');
          }
        },
      },
    ]);
  };

  const isAlreadyFriend = (uid: string) => myFriends.includes(uid);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('friends.title')} showHelp />

      <View
        style={styles.tabs}
        collapsable={false}
        ref={node => registerTarget('friends-tabs', node)}
      >
        {(['my-friends', 'add-friend', 'referrals'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'my-friends'
                ? t('friends.myFriendsTab', { count: myFriends.length })
                : tab === 'add-friend'
                ? t('friends.addFriendTab')
                : t('friends.referralsTab')}
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
              <Text style={styles.emptyText}>{t('friends.noFriends')}</Text>
              <Text style={styles.emptyHint}>{t('friends.noFriendsHint')}</Text>
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
                  <Text style={styles.removeBtnText}>{t('common.remove')}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {!loading && activeTab === 'add-friend' && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.searchLabel}>{t('friends.searchLabel')}</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('friends.searchPlaceholder')}
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
                : <Text style={styles.searchBtnText}>{t('common.search')}</Text>
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
                  <Text style={styles.alreadyFriendText}>{t('friends.added')}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddFriend(searchResult.uid)}
                >
                  <Text style={styles.addBtnText}>{t('common.add')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'referrals' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {plan === 'free' ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('friends.referralsFreeTitle')}</Text>
              <Text style={styles.emptyHint}>{t('friends.referralsFreeHint')}</Text>
            </View>
          ) : referralLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : referralOverview ? (
            <>
              <View style={styles.referralSummary}>
                <Text style={styles.referralSummaryText}>
                  {t('friends.referralSlots', { available: referralOverview.available, slots: referralOverview.slots })}
                </Text>
                <TouchableOpacity
                  style={[styles.searchBtn, (generating || referralOverview.available <= 0) && styles.btnDisabled]}
                  onPress={handleGenerateReferral}
                  disabled={generating || referralOverview.available <= 0}
                >
                  {generating
                    ? <ActivityIndicator size="small" color={Colors.background} />
                    : <Text style={styles.searchBtnText}>{t('friends.createReferral')}</Text>
                  }
                </TouchableOpacity>
              </View>

              {referralOverview.referrals.length === 0 ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>{t('friends.noReferrals')}</Text>
                </View>
              ) : (
                referralOverview.referrals.map((r) => (
                  <View key={r._id} style={styles.friendRow}>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendUid}>{r.code}</Text>
                      <Text style={styles.friendEmail}>
                        {r.status === 'redeemed'
                          ? (r.rewardGranted ? t('friends.referralRedeemedRewarded') : t('friends.referralRedeemed'))
                          : t('friends.referralUnused')}
                      </Text>
                    </View>
                    {r.status === 'unused' && (
                      <TouchableOpacity style={styles.addBtn} onPress={() => shareReferralLink(r.code)}>
                        <Text style={styles.addBtnText}>{t('friends.shareLink')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('friends.referralsLoadFailed')}</Text>
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
  referralSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  referralSummaryText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.sm,
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
