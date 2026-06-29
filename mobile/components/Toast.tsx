import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: 'success' | 'error';
  onHide: () => void;
}

export default function Toast({ visible, message, variant = 'success', onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    maxWidth: 340,
  },
  toastSuccess: {
    backgroundColor: 'rgba(0, 222, 236, 0.1)',
    borderColor: Colors.accent,
  },
  toastError: {
    backgroundColor: Colors.errorDim,
    borderColor: Colors.error,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
