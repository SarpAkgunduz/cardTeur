import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { playSound, type SoundName } from '../utils/sounds';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: 'success' | 'error';
  // Lets a call site play a more specific sound than the generic
  // success/error chime (e.g. 'achievement' for a card reveal, 'badge'
  // for a crew addition) — this is the single place a toast's sound is
  // triggered, so a screen never has to also call playSound() itself and
  // risk two sounds firing together. Pass 'none' to suppress sound.
  sound?: SoundName | 'none';
  onHide: () => void;
}

export default function Toast({ visible, message, variant = 'success', sound, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const soundToPlay = sound === 'none' ? null : sound ?? (variant === 'error' ? 'error' : 'success');
      if (soundToPlay) playSound(soundToPlay);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.toast, variant === 'error' ? styles.toastError : styles.toastSuccess]}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    // Toast is the app's single shared notification surface (rendered on
    // top of Roster/Crew/Friends/Development/player screens, all of which
    // have their own scrolling content underneath). It needs to sit above
    // everything else on the screen, on both platforms — zIndex alone is
    // an iOS/JS-stacking-context concept and doesn't reliably raise a
    // view's actual paint order on Android, where `elevation` is what
    // controls it.
    zIndex: 999,
    elevation: 999,
    alignItems: 'center',
  },
  toast: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    maxWidth: 340,
    // Previously a near-transparent tint (0.1 / errorDim alpha), so the
    // player list scrolling underneath showed through and its text
    // visually collided with the toast's own text. A solid backing color
    // (still tinted per variant, just opaque) is what actually stops
    // that bleed-through — the colored border still carries the
    // success/error distinction.
    backgroundColor: Colors.panelBgSolid,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  toastSuccess: {
    borderColor: Colors.accent,
  },
  toastError: {
    borderColor: Colors.error,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
