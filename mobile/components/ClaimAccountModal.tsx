import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api/apiClient';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { useAppleSignIn } from '../hooks/useAppleSignIn';

interface ClaimAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onClaimed?: () => void;
  titleKey?: string;
  textKey?: string;
}

// Reusable "turn this guest session into a real account" modal — used by
// the locked-tab screen, the soft save banner, and the timed reminder.
// Linking is handled in AuthContext.signUp / useGoogleSignIn, so this
// component only has to collect the credentials and call them.
export default function ClaimAccountModal({ visible, onClose, onClaimed, titleKey, textKey }: ClaimAccountModalProps) {
  const { t } = useTranslation();
  const { signUp, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const google = useGoogleSignIn(async () => {
    await refreshProfile();
    onClaimed?.();
    onClose();
  });
  const apple = useAppleSignIn(async () => {
    await refreshProfile();
    onClaimed?.();
    onClose();
  });

  const finishClaim = async () => {
    await refreshProfile();
    onClaimed?.();
    onClose();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signUp(email.trim(), password);
      await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({ displayName: displayName.trim() || undefined }),
      });
      await finishClaim();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
        setError(t('guest.claimEmailInUse'));
      } else if (code === 'auth/weak-password') {
        setError(t('auth.passwordTooShort'));
      } else {
        setError(t('auth.signupFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>🔒</Text>
              </View>
              <Text style={styles.title}>{t(titleKey ?? 'guest.claimTitle')}</Text>
              <Text style={styles.text}>{t(textKey ?? 'guest.claimText')}</Text>

              {(error || google.error || apple.error) ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error || google.error || apple.error}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.displayName')}</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t('auth.displayNamePh')}
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('common.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('common.password')}</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting
                  ? <ActivityIndicator color={Colors.background} />
                  : <Text style={styles.btnText}>{t('guest.claimSaveCta')}</Text>
                }
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('common.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleBtn, (!google.ready || google.loading) && styles.btnDisabled]}
                onPress={google.signIn}
                disabled={!google.ready || google.loading}
                activeOpacity={0.8}
              >
                {google.loading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <View style={styles.googleBtnContent}>
                    <Ionicons name="logo-google" size={18} color={Colors.textPrimary} />
                    <Text style={styles.googleBtnText}>{t('auth.googleBtn')}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {apple.available && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                  cornerRadius={0}
                  style={styles.appleBtn}
                  onPress={apple.signIn}
                />
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.panelBgSolid,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    padding: Spacing.xl,
    width: '100%',
    maxHeight: '90%',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  icon: { fontSize: 20 },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSizes.sm, textAlign: 'center' },
  field: { marginBottom: Spacing.md },
  label: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    padding: Spacing.sm + 4,
    fontSize: FontSizes.md,
  },
  btn: {
    backgroundColor: Colors.accent,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: FontSizes.sm,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appleBtn: {
    height: 48,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 17,
  },
  closeBtn: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  closeBtnText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
