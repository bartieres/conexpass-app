import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/logo_conexpass.png';

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
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Image
              source={Logo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="ConexPass"
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Que bom ter você aqui!</Text>
            <Text style={styles.subtitle}>
              Entre para continuar explorando.
            </Text>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="nome@email.com"
                placeholderTextColor={colors.textLight}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                accessibilityLabel="E-mail"
              />
            </View>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (!loading) handleLogin();
                }}
                accessibilityLabel="Senha"
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setShowPassword((s) => !s)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate('ForgotPassword')}
              accessibilityRole="button"
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>
            {!!errorMessage && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>
            {/*<View style={styles.dividerRow}>
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
          </View>*/}
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Ainda não tem conta?</Text>
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
            >
              <Text style={styles.footerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 184, height: 116 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EDF0F6',
    shadowColor: '#21365C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
    elevation: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: 28,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#52617A', marginBottom: 8 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 54,
    marginBottom: 18,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 15,
  },
  visibilityButton: { paddingVertical: 12, paddingLeft: 4 },
  forgotLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginTop: -10,
    marginBottom: 20,
  },
  forgotText: { color: colors.blue, fontSize: 12, fontWeight: '600' },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 14,
    minHeight: 54,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorBox: {
    backgroundColor: '#FFF1F1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 19 },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingTop: 18,
  },
  footerText: { color: colors.textMuted, fontSize: 13 },
  registerLink: { paddingVertical: 12, paddingHorizontal: 4 },
  footerLink: { color: colors.blue, fontSize: 13, fontWeight: '700' },
});
