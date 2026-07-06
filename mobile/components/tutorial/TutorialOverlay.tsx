import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useTutorial } from '../../contexts/TutorialContext';
import { TUTORIAL_STEPS } from './tutorialSteps';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;
const POPUP_EST_HEIGHT = 250;
const POPUP_GAP = 16;
const FIND_INTERVAL_MS = 150;
const FIND_MAX_TRIES = 16;
const DIM_COLOR = 'rgba(8, 15, 26, 0.85)';

export default function TutorialOverlay() {
  const { active, stepIndex, totalSteps, closeTutorial, nextStep, prevStep, getTarget } =
    useTutorial();
  const router = useRouter();
  const pathname = usePathname();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [searching, setSearching] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;

  const step = TUTORIAL_STEPS[stepIndex];

  // Reset the spotlight as soon as the step changes
  useEffect(() => {
    setRect(null);
    setSearching(!!step?.targetId);
  }, [stepIndex, step]);

  // Navigate to the step's tab when needed
  useEffect(() => {
    if (!active || !step) return;
    if (pathname !== step.pathname) {
      router.replace(step.route as never);
    }
  }, [active, step, pathname, router]);

  // Find and measure the target
  useEffect(() => {
    if (!active || !step) return;
    if (pathname !== step.pathname) return;

    setRect(null);

    if (!step.targetId) {
      setSearching(false);
      return;
    }

    setSearching(true);
    let tries = 0;
    let done = false;

    const tryMeasure = () => {
      const node = getTarget(step.targetId!);
      if (node) {
        node.measureInWindow((x, y, w, h) => {
          if (done) return;
          if (w > 0 && h > 0) {
            done = true;
            clearInterval(interval);
            setRect({
              top: y - SPOTLIGHT_PADDING,
              left: x - SPOTLIGHT_PADDING,
              width: w + SPOTLIGHT_PADDING * 2,
              height: h + SPOTLIGHT_PADDING * 2,
            });
            setSearching(false);
          }
        });
      }
      tries += 1;
      if (tries >= FIND_MAX_TRIES && !done) {
        done = true;
        clearInterval(interval);
        setSearching(false);
      }
    };

    const interval = setInterval(tryMeasure, FIND_INTERVAL_MS);
    tryMeasure();

    return () => {
      done = true;
      clearInterval(interval);
    };
  }, [active, step, stepIndex, pathname, getTarget]);

  // Pulsing glow on the spotlight border
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, glow]);

  if (!active || !step || searching) return null;

  const centered = !rect;
  const isLast = stepIndex === totalSteps - 1;

  let popupTop = screenH / 2 - POPUP_EST_HEIGHT / 2;
  if (rect) {
    const below = rect.top + rect.height + POPUP_GAP;
    popupTop =
      below + POPUP_EST_HEIGHT <= screenH
        ? below
        : Math.max(Spacing.md, rect.top - POPUP_EST_HEIGHT - POPUP_GAP);
  }

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 222, 236, 0.45)', 'rgba(0, 222, 236, 1)'],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      {/* Dim layers — leave a hole over the target */}
      {rect ? (
        <>
          <Pressable style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }]} />
          <Pressable
            style={[styles.dim, { top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }]}
          />
          <Pressable
            style={[
              styles.dim,
              {
                top: rect.top,
                left: rect.left + rect.width,
                width: Math.max(0, screenW - rect.left - rect.width),
                height: rect.height,
              },
            ]}
          />
          <Pressable
            style={[
              styles.dim,
              { top: rect.top + rect.height, left: 0, right: 0, height: Math.max(0, screenH - rect.top - rect.height) },
            ]}
          />
          {/* Block taps inside the hole while the tour is running */}
          <Pressable
            style={{ position: 'absolute', top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightBorder,
              {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                borderColor,
              },
            ]}
          />
        </>
      ) : (
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: DIM_COLOR }]} />
      )}

      {/* Popup card */}
      <View style={[styles.popup, { top: popupTop }, centered && styles.popupCentered]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={closeTutorial}
          accessibilityLabel="Close tutorial"
        >
          <Ionicons name="close" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.progress}>
          {stepIndex + 1} / {totalSteps}
        </Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.text}>{step.text}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={closeTutorial}>
            <Text style={styles.skip}>Skip tour</Text>
          </TouchableOpacity>
          <View style={styles.navBtns}>
            {stepIndex > 0 && (
              <TouchableOpacity style={styles.btn} onPress={prevStep}>
                <Text style={styles.btnText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.btnNext]} onPress={nextStep}>
              <Text style={styles.btnText}>{isLast ? 'Finish' : 'Next'}</Text>
              {!isLast && <Ionicons name="arrow-forward" size={13} color={Colors.accent} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    backgroundColor: DIM_COLOR,
  },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 10,
    shadowColor: Colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  popup: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(36, 59, 90, 0.98)',
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  popupCentered: {},
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 1,
  },
  progress: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textDecorationLine: 'underline',
  },
  navBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: 'rgba(0, 222, 236, 0.08)',
  },
  btnNext: {
    backgroundColor: 'rgba(0, 222, 236, 0.2)',
  },
  btnText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
