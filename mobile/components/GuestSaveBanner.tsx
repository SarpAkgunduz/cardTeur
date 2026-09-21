import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { usePlayers } from '../contexts/PlayerContext';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import ClaimAccountModal from './ClaimAccountModal';

const dismissedKey = (uid: string) => `ct_guest_banner_dismissed_${uid}`;

// A quiet, dismissible strip shown once a guest has made something worth
// losing — their first card — rather than nagging before they've seen
// any value. Mirrors the web landing/roster banner.
export default function GuestSaveBanner() {
  const { t } = useTranslation();
  const { currentUser, isGuest } = useAuth();
  const { players } = usePlayers();
  const [dismissed, setDismissed] = useState(true); // default hidden until the AsyncStorage check resolves
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setDismissed(false);
      setChecked(true);
      return;
    }
    AsyncStorage.getItem(dismissedKey(currentUser.uid))
      .then((v) => setDismissed(v === '1'))
      .catch(() => setDismissed(false))
      .finally(() => setChecked(true));
  }, [currentUser]);

  if (!isGuest || !checked || dismissed || players.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    if (currentUser) {
      AsyncStorage.setItem(dismissedKey(currentUser.uid), '1').catch(() => {});
    }
  };

  return (
    <>
      <View style={styles.bar}>
        <Ionicons name="shield-half-outline" size={16} color={Colors.accent} />
        <Text style={styles.text} numberOfLines={2}>{t('guest.bannerText', { count: players.length })}</Text>
        <TouchableOpacity style={styles.cta} onPress={() => setShowModal(true)}>
          <Text style={styles.ctaText}>{t('guest.claimSaveCta')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismiss} onPress={dismiss}>
          <Ionicons name="close" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      <ClaimAccountModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onClaimed={dismiss}
        titleKey="guest.bannerModalTitle"
        textKey="guest.claimText"
      />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentDim,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentBorder,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  text: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  cta: {
    backgroundColor: Colors.accent,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm + 2,
  },
  ctaText: {
    color: Colors.background,
    fontWeight: '800',
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
  },
  dismiss: {
    padding: 4,
  },
});
