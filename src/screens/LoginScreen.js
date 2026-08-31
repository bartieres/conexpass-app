import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/logo.png';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Informe e-mail e senha para continuar.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      await login(identifier, password);
      // Não precisa navegar manualmente: o AuthContext muda isAuthenticated
      // e o RootNavigator (App.js) troca a stack para MainTabs automaticamente.
    } catch (err) {
      //alert(err, 'Login functionality is not implemented yet.');
      setErrorMessage(err.friendlyMessage || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Image
            source={Logo}
            style={{ height: 130, resizeMode: 'contain' }}
          />
          <Text style={styles.tagline}>Treine onde e quando quiser</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Bem-vindo de volta!</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>

          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={colors.textLight}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {!!errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="google" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="apple" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadow,
  },
  brand: { fontSize: 24, fontWeight: '800', color: colors.blue },
  tagline: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 22,
    ...shadow,
  },
  title: { ...typography.h2, marginBottom: 2 },
  subtitle: { ...typography.muted, marginBottom: 20 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: colors.text },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 18 },
  forgotText: { color: colors.blue, fontSize: 13, fontWeight: '600' },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 12.5, flex: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 10, color: colors.textLight, fontSize: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 20 },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 13 },
  footerLink: { color: colors.blue, fontSize: 13, fontWeight: '700' },
});
