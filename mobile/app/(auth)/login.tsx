import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const router = useRouter();
  const google = useGoogleSignIn(() => router.replace('/(tabs)/roster'));

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first.');
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
    } catch {
      setError('Could not send reset email. Check the address and try again.');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/roster');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.box}>
            <Text style={styles.title}>
              Card<Text style={styles.titleAccent}>Teur</Text>
            </Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {(error || google.error) ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error || google.error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, submitting && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.btnText}>LOGIN</Text>
              }
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, (!google.ready || google.loading) && styles.btnDisabled]}
              onPress={google.signIn}
              disabled={!google.ready || google.loading}
              activeOpacity={0.8}
            >
              {google.loading
                ? <ActivityIndicator color={Colors.textPrimary} />
                : <Text style={styles.googleBtnText}>Continue with Google</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupAccent}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  box: {
    backgroundColor: Colors.panelBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: Colors.accent,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorBox: {
    backgroundColor: Colors.errorDim,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  field: {
    marginBottom: Spacing.md,
  },
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
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: Colors.background,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: FontSizes.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
  },
  forgotText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textDecorationLine: 'underline',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  googleBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSizes.sm,
    letterSpacing: 0.5,
  },
  signupLink: {
    alignItems: 'center',
  },
  signupText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  signupAccent: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
