import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/api/apiClient';
import { userApi } from '../../services/api/userApi';
import ScreenHeader from '../../components/ScreenHeader';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { PRESET_AVATARS, resolveCardImage } from '../../utils/cardImage';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import type { AppUser, Plan } from '../../services/api/types';

const PLAN_ORDER: Plan[] = ['free', 'premium', 'premium_plus'];

export default function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentUser, plan, isGuest, signOut, refreshProfile } = useAuth();

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    userApi.getMe()
      .then((me) => {
        if (cancelled) return;
        setProfile(me);
        setDisplayName(me.displayName || '');
        setPhotoURL(me.photoURL || '');
      })
      .catch(() => {
        if (!cancelled) {
          setDisplayName(currentUser?.displayName || '');
        }
      })
      .finally(() => { if (!cancelled) setLoadingProfile(false); });
    return () => { cancelled = true; };
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setSaveNotice(null);
    try {
      const updated = await userApi.updateProfile({
        displayName: displayName.trim(),
        photoURL: photoURL || undefined,
      });
      setProfile(updated);
      setSaveNotice(t('account.saved'));
    } catch {
      setSaveNotice(t('account.saveFailed'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveNotice(null), 2500);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t('account.signOutConfirmTitle'), t('account.signOutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('account.deleteConfirmTitle'), t('account.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await apiRequest('/users/account', { method: 'DELETE' });
            await signOut();
            router.replace('/(auth)/login');
          } catch {
            Alert.alert(t('account.deleteFailed'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleUpgrade = () => {
    Alert.alert(t('account.comingSoonTitle'), t('account.comingSoonMessage'));
  };

  const handleManageSubscription = () => {
    Linking.openURL('itms-apps://apps.apple.com/account/subscriptions').catch(() => {});
  };

  const planLabel = plan === 'premium' ? t('pricing.premiumName')
    : plan === 'premium_plus' ? t('pricing.premiumPlusName')
    : t('pricing.freeName');

  const planFeatures: Record<Plan, string[]> = {
    free: [t('pricing.freeFeature1'), t('pricing.freeFeature2'), t('pricing.freeFeature3'), t('pricing.freeFeature4'), t('pricing.freeFeature5')],
    premium: [t('pricing.premiumFeature1'), t('pricing.premiumFeature2'), t('pricing.premiumFeature3'), t('pricing.premiumFeature4'), t('pricing.premiumFeature5'), t('pricing.premiumFeature6')],
    premium_plus: [t('pricing.premiumPlusFeature1'), t('pricing.premiumPlusFeature2'), t('pricing.premiumPlusFeature3'), t('pricing.premiumPlusFeature4'), t('pricing.premiumPlusFeature5')],
  };

  const avatarSrc = photoURL ? resolveCardImage(photoURL) : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('account.title')} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loadingProfile ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <>
            {/* Profile card */}
            <View style={styles.card}>
              <View style={styles.profileRow}>
                <TouchableOpacity
                  style={styles.avatarWrap}
                  onPress={() => setShowAvatarPicker(v => !v)}
                  activeOpacity={0.8}
                >
                  {avatarSrc ? (
                    <Image source={{ uri: avatarSrc }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>
                        {(displayName || currentUser?.email || '?')[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Text style={styles.avatarEditBadgeText}>✎</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Text style={styles.email} numberOfLines={1}>{currentUser?.email}</Text>
                  {isGuest && <Text style={styles.guestTag}>{t('guest.defaultName')}</Text>}
                </View>
              </View>

              {showAvatarPicker && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPicker}>
                  {PRESET_AVATARS.map((uri) => (
                    <TouchableOpacity
                      key={uri}
                      style={[styles.avatarThumbWrap, photoURL === uri && styles.avatarThumbWrapActive]}
                      onPress={() => { setPhotoURL(uri); setShowAvatarPicker(false); }}
                    >
                      <Image source={{ uri }} style={styles.avatarThumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('account.displayName')}</Text>
                <View style={styles.inputRow}>
                  <Text
                    style={styles.inputText}
                    numberOfLines={1}
                  >
                    {displayName || t('account.displayNamePh')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Text style={styles.saveBtnText}>{t('account.save')}</Text>
                )}
              </TouchableOpacity>
              {saveNotice && <Text style={styles.saveNotice}>{saveNotice}</Text>}

              {!isGuest && (
                <View style={styles.idRow}>
                  <Text style={styles.idLabel}>{t('account.uid')}</Text>
                  <Text style={styles.idValue} selectable numberOfLines={1}>{currentUser?.uid}</Text>
                  <Text style={styles.idHint}>{t('account.uidHint')}</Text>
                </View>
              )}
            </View>

            {/* Plan card */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('account.planTitle')}</Text>
              </View>
              <Text style={styles.currentPlan}>{t('account.currentPlan', { plan: planLabel })}</Text>
              {planFeatures[plan].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
              {plan === 'free' ? (
                <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.8}>
                  <Text style={styles.upgradeBtnText}>{t('account.upgrade')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.manageBtn} onPress={handleManageSubscription} activeOpacity={0.8}>
                  <Text style={styles.manageBtnText}>{t('account.manageSubscription')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Language card */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('account.language')}</Text>
              </View>
              <LanguageSwitcher floating={false} />
            </View>

            {/* Sign out */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
              <Text style={styles.signOutBtnText}>{t('account.signOut')}</Text>
            </TouchableOpacity>

            {/* Danger zone */}
            <View style={[styles.card, styles.dangerCard]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.dangerTitle}>{t('account.dangerZone')}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDeleteAccount}
                disabled={deleting}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Text style={styles.deleteBtnText}>{t('account.deleteAccount')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  card: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarWrap: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  avatarFallback: {
    backgroundColor: Colors.panelBgSolid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.accent,
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatarEditBadgeText: {
    fontSize: 10,
    color: Colors.background,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  email: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  guestTag: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  avatarPicker: {
    marginBottom: Spacing.md,
  },
  avatarThumbWrap: {
    marginRight: Spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarThumbWrapActive: {
    borderColor: Colors.accent,
  },
  avatarThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  field: {
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  inputText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  saveNotice: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  idRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  idLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  idValue: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  idHint: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  currentPlan: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginRight: Spacing.sm,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  upgradeBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  upgradeBtnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  manageBtn: {
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  manageBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  signOutBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  dangerCard: {
    borderColor: 'rgba(255,107,107,0.35)',
  },
  dangerTitle: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: Colors.error,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
});
