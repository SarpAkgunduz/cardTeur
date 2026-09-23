import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage } from '../i18n';
import { Colors, Spacing, FontSizes } from '../constants/theme';

interface LanguageSwitcherProps {
  // Absolute-positions the trigger button in a screen's top-right corner
  // (e.g. the login screen, which has no ScreenHeader of its own). Pass
  // false to render it as a plain inline element instead.
  floating?: boolean;
  style?: object;
}

export default function LanguageSwitcher({ floating = true, style }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelect = async (code: string) => {
    setOpen(false);
    if (code !== i18n.language) {
      await changeLanguage(code);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, floating && styles.triggerFloating, style]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Change language"
      >
        <Ionicons name="globe-outline" size={14} color={Colors.accent} />
        <Text style={styles.triggerText}>{current.code.toUpperCase()}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, item.code === i18n.language && styles.rowActive]}
                  onPress={() => handleSelect(item.code)}
                >
                  <Text style={[styles.rowText, item.code === i18n.language && styles.rowTextActive]}>
                    {item.label}
                  </Text>
                  {item.code === i18n.language && (
                    <Ionicons name="checkmark" size={16} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: 'rgba(0, 222, 236, 0.08)',
  },
  triggerFloating: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
  },
  triggerText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.panelBgSolid,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: 4,
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    paddingVertical: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
  },
  rowActive: {
    backgroundColor: 'rgba(0, 222, 236, 0.08)',
  },
  rowText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  rowTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
