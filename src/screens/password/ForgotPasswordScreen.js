import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

function isValidEmail(value) {
  // Formato básico: algo@algo.algo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSend = async () => {
    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      await forgotPassword(email);
      navigation.navigate('ForgotPasswordSuccess', { email });
    } catch (err) {
      setErrorMessage(
        err.friendlyMessage ||
          'Não foi possível enviar o e-mail. Tente novamente.'
      );
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
          <Image
            source={require('../../assets/logo_conexpass.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="ConexPass"
          />
          <View style={styles.card}>
            <LinearGradient
              colors={['#E4EEFF', '#E8F6EF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBackdrop}
            >
              <Ionicons name="key-outline" size={32} color={colors.blue} />
            </LinearGradient>
            <Text style={styles.title}>Esqueceu sua senha?</Text>
            <Text style={styles.subtitle}>
              Tudo bem! Informe seu e-mail cadastrado e enviaremos um link para
              recuperar seu acesso.
            </Text>
            <Text style={styles.label}>E-mail</Text>
            <View
              style={[
                styles.inputGroup,
                !!errorMessage && styles.inputGroupError,
              ]}
            >
              <Ionicons name="mail-outline" size={20} color={colors.blue} />
              <TextInput
                style={styles.input}
                placeholder="nome@email.com"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="send"
                value={email}
                onChangeText={setEmail}
                accessibilityLabel="E-mail cadastrado"
                onSubmitEditing={() => {
                  if (!loading && isValidEmail(email)) handleSend();
                }}
              />
            </View>
            {email.length > 0 && !isValidEmail(email) && (
              <Text style={styles.emailHint}>
                Digite um e-mail válido, ex: nome@email.com
              </Text>
            )}
            {!!errorMessage && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#B91C1C"
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !isValidEmail(email)) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleSend}
              activeOpacity={0.85}
              disabled={loading || !isValidEmail(email)}
              accessibilityRole="button"
              accessibilityState={{
                disabled: loading || !isValidEmail(email),
                busy: loading,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Enviar link</Text>
                  <Ionicons name="arrow-forward" size={19} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={16} color={colors.blue} />
            <Text style={styles.loginText}>
              Lembrei minha senha, voltar ao login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 14,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  logo: { width: 190, height: 120, alignSelf: 'center', marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  iconBackdrop: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 24,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#52617A', marginBottom: 8 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 54,
    backgroundColor: '#FCFDFF',
  },
  inputGroupError: { borderColor: '#E9A5A5' },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 15,
  },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    minHeight: 54,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 14,
    marginTop: 18,
  },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 19, flex: 1 },
  emailHint: { fontSize: 12, color: '#A35E14', lineHeight: 18, marginTop: 8 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#FFF7E5',
    borderRadius: 14,
    padding: 13,
    marginTop: 18,
  },
  tipText: { flex: 1, color: '#805F31', fontSize: 12, lineHeight: 19 },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  loginText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 19,
    color: colors.blue,
    fontWeight: '600',
    textAlign: 'center',
  },
});
