import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { useTutorial } from '../contexts/TutorialContext';
import { useAuth } from '../contexts/AuthContext';
import ClaimAccountModal from './ClaimAccountModal';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  showHelp?: boolean;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, showBack = false, showHelp = false, right }: ScreenHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { startTutorial } = useTutorial();
  const { plan, isGuest } = useAuth();
  const isPremium = plan === 'premium' || plan === 'premium_plus';
  // A guest can otherwise only reach sign-up from the roster banner (after
  // making a card) or a locked tab — this puts the same "claim your
  // account" entry point on every screen's header, since ScreenHeader is
  // shared across the whole app (including Match, where there was
  // previously no way back to login/signup at all).
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleHelp = () => {
    Alert.alert(t('tutorial.help'), t('tutorial.helpMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('tutorial.replay'), onPress: startTutorial },
    ]);
  };

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color={Colors.accent} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        <View style={styles.corner}>
          {isGuest && (
            <TouchableOpacity
              onPress={() => setShowClaimModal(true)}
              style={styles.guestBtn}
              accessibilityLabel={t('guest.claimSaveCta')}
            >
              <Ionicons name="person-add-outline" size={13} color={Colors.accent} />
            </TouchableOpacity>
          )}
          {isPremium && (
            <View
              style={[
                styles.planBadge,
                plan === 'premium_plus' && styles.planBadgePlus,
              ]}
            >
              <Ionicons
                name="diamond"
                size={11}
                color={plan === 'premium_plus' ? Colors.cardGold : Colors.accent}
              />
              <Text
                style={[
                  styles.planBadgeText,
                  plan === 'premium_plus' && styles.planBadgeTextPlus,
                ]}
              >
                {plan === 'premium_plus' ? t('pricing.premiumPlusName') : t('pricing.premiumName')}
              </Text>
            </View>
          )}
          {showHelp && (
            <TouchableOpacity onPress={handleHelp} style={styles.helpBtn} accessibilityLabel="Help">
              <Ionicons name="help" size={14} color={Colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Action buttons (right prop, e.g. roster/crew's mode toggles) get
          their own row below the title instead of squeezing onto the title
          row — that squeeze was what forced the title to truncate
          ("Oyuncular" -> "Oyuncul...") since it had to share its row with
          the help button, plan badge, guest CTA AND these action buttons. */}
      {right && <View style={styles.actionsRow}>{right}</View>}
      <ClaimAccountModal visible={showClaimModal} onClose={() => setShowClaimModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(36, 59, 90, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  left: {
    flexShrink: 0,
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: Colors.accent,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    // Left-aligned rather than centered — with a wide corner cluster (help
    // button, plan badge, guest CTA), a centered title has less room on
    // its right side than its left, so it wrapped/truncated ("Oyuncular"
    // -> "Oyuncul...") well before it actually ran out of header width.
    // Left-aligned, it only has to yield the same side the buttons are on.
    // Action buttons no longer share this row at all (see actionsRow), so
    // the title now only competes with the small corner cluster.
    textAlign: 'left',
    marginLeft: 8,
    marginRight: 4,
  },
  corner: {
    flexShrink: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  helpBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: 'rgba(0, 222, 236, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: 'rgba(0, 222, 236, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: 'rgba(0, 222, 236, 0.1)',
  },
  planBadgePlus: {
    borderColor: 'rgba(232, 192, 96, 0.5)',
    backgroundColor: 'rgba(232, 192, 96, 0.1)',
  },
  planBadgeText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  planBadgeTextPlus: {
    color: Colors.cardGold,
  },
});
