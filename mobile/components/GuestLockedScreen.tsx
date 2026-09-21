import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import ClaimAccountModal from './ClaimAccountModal';

interface GuestLockedScreenProps {
  featureName: string;
}

// Rendered in place of a tab's normal content when a guest (anonymous)
// user opens a feature that requires a real, saved account.
export default function GuestLockedScreen({ featureName }: GuestLockedScreenProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🔒</Text>
        </View>
        <Text style={styles.title}>{t('guest.lockedTitle', { feature: featureName })}</Text>
        <Text style={styles.text}>{t('guest.lockedText')}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Text style={styles.btnText}>{t('guest.claimSaveCta')}</Text>
        </TouchableOpacity>
      </View>
      <ClaimAccountModal visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: 4,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  icon: { fontSize: 24 },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  btn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
  },
  btnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
});
