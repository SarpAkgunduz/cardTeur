import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { useTutorial } from '../contexts/TutorialContext';
import { useAuth } from '../contexts/AuthContext';

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
  const { plan } = useAuth();
  const isPremium = plan === 'premium' || plan === 'premium_plus';

  const handleHelp = () => {
    Alert.alert(t('tutorial.help'), t('tutorial.helpMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('tutorial.replay'), onPress: startTutorial },
    ]);
  };

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.accent} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
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
        {right}
        {showHelp && (
          <TouchableOpacity onPress={handleHelp} style={styles.helpBtn} accessibilityLabel="Help">
            <Ionicons name="help" size={14} color={Colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: 'rgba(36, 59, 90, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    color: Colors.accent,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
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
