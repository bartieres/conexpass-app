import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function isValidPassword(password) {
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasMinLength && hasLetter && hasNumber;
}

function RegistrationField({ label, visible, onToggleVisible, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          accessibilityLabel={label}
          {...inputProps}
        />
        {onToggleVisible && (
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={onToggleVisible}
            accessibilityRole="button"
            accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      documento.replace(/\D/g, '').length !== 11 ||
      !password
    ) {
      setErrorMessage('Preencha todos os campos corretamente.');
      return;
    }
    if (!isValidPassword(password)) {
      setErrorMessage(
        'A senha deve ter pelo menos 8 caracteres, incluindo letras e números.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const dataFormatted = {
        nome: name,
        email: email,
        documento: documento,
        senha: password,
      };

      await register(dataFormatted);
      navigation.navigate('RegisterSuccess', { email });
      // A próxima etapa mantém a orientação de confirmação do e-mail.
    } catch (err) {
      setErrorMessage(
        err.friendlyMessage ||
          'Não foi possível criar sua conta. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openLink = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Não foi possível abrir o link',
        'Tente novamente mais tarde.'
      );
    }
  };

  const passwordRules = [
    { label: '8 caracteres ou mais', valid: password.length >= 8 },
    { label: 'Pelo menos uma letra', valid: /[a-zA-Z]/.test(password) },
    { label: 'Pelo menos um número', valid: /[0-9]/.test(password) },
  ];

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
          <View style={styles.topBar}>
            <Image
              source={require('../../assets/logo-conexpass.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="ConexPass"
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Vamos começar com seus dados.</Text>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Sobre você</Text>
            </View>
            <RegistrationField
              label="Nome completo"
              placeholder="Como você se chama?"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
            <RegistrationField
              label="E-mail"
              placeholder="Seu melhor e-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
            />
            <RegistrationField
              label="CPF"
              placeholder="000.000.000-00"
              keyboardType="numeric"
              value={documento}
              onChangeText={(v) => setDocumento(maskCPF(v))}
              maxLength={14}
            />
            <View style={styles.divider} />
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Seu acesso</Text>
            </View>
            <RegistrationField
              label="Senha"
              placeholder="Crie sua senha"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.passwordRules}>
              {passwordRules.map((rule) => (
                <View key={rule.label} style={styles.ruleRow}>
                  <Ionicons
                    name={rule.valid ? 'checkmark-circle' : 'ellipse-outline'}
                    size={15}
                    color={rule.valid ? '#237759' : colors.textLight}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      rule.valid && styles.ruleTextValid,
                    ]}
                  >
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>
            <RegistrationField
              label="Confirmar senha"
              placeholder="Digite a senha novamente"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              visible={showConfirmPassword}
              onToggleVisible={() => setShowConfirmPassword((v) => !v)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {confirmPassword.length > 0 && (
              <Text
                style={[
                  styles.matchHint,
                  password === confirmPassword
                    ? styles.ruleTextValid
                    : styles.mismatchHint,
                ]}
              >
                {password === confirmPassword
                  ? 'As senhas coincidem.'
                  : 'As senhas ainda não coincidem.'}
              </Text>
            )}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                onPress={() => setAgreed((a) => !a)}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityLabel="Concordo com os Termos de Uso e a Política de Privacidade"
                accessibilityState={{ checked: agreed }}
                style={styles.checkboxTouch}
              >
                <View
                  style={[styles.checkbox, agreed && styles.checkboxChecked]}
                >
                  {agreed && (
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.checkboxText}>
                Li e concordo com os{' '}
                <Text
                  style={styles.linkText}
                  onPress={() =>
                    openLink('https://conexpass.com.br/termos-uso')
                  }
                >
                  Termos de Uso
                </Text>{' '}
                e{' '}
                <Text
                  style={styles.linkText}
                  onPress={() =>
                    openLink('https://conexpass.com.br/politica-privacidade')
                  }
                >
                  Política de Privacidade
                </Text>
                .
              </Text>
            </View>
            {!!errorMessage && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!agreed || loading || !isValidPassword(password)) &&
                  styles.primaryButtonDisabled,
              ]}
              disabled={!agreed || loading || !isValidPassword(password)}
              onPress={handleRegister}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{
                disabled: !agreed || loading || !isValidPassword(password),
                busy: loading,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.exploreHint}>
              Você pode explorar antes de escolher um plano.
            </Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
            >
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  container: { flexGrow: 1, padding: 20, paddingTop: 12, paddingBottom: 20 },
  topBar: { alignItems: 'center', paddingTop: 16, marginBottom: 28 },
  logo: { width: 166, height: 36 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDF0F6',
    shadowColor: '#21365C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
    elevation: 1,
  },
  title: { fontSize: 23, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 24,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 18,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 2,
    marginBottom: 20,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#52617A', marginBottom: 7 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 13,
    minHeight: 52,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 14,
    minWidth: 0,
  },
  visibilityButton: { paddingVertical: 12, paddingLeft: 2 },
  passwordRules: {
    backgroundColor: '#F7F9FC',
    borderRadius: 14,
    padding: 13,
    gap: 8,
    marginTop: -3,
    marginBottom: 18,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ruleText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    flexShrink: 1,
  },
  ruleTextValid: { color: '#237759', fontWeight: '600' },
  matchHint: { fontSize: 12, lineHeight: 18, marginTop: -7, marginBottom: 14 },
  mismatchHint: { color: '#A35E14' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    marginBottom: 18,
  },
  checkboxTouch: { padding: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#C5D2E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textMuted,
    paddingTop: 3,
  },
  linkText: { color: colors.blue, fontWeight: '600' },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    minHeight: 54,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  exploreHint: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
  },
  errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 19, flex: 1 },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 14,
  },
  footerText: { color: colors.textMuted, fontSize: 13 },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  footerLink: { color: colors.blue, fontSize: 13, fontWeight: '700' },
});
