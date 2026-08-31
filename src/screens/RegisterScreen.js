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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || cpf.replace(/\D/g, '').length !== 11 || !password) {
      setErrorMessage('Preencha todos os campos corretamente.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      await register({ name, email, cpf, password });
      // AuthContext atualiza isAuthenticated e o app troca para MainTabs sozinho
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Não foi possível criar sua conta. Tente novamente.');
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha seus dados para criar sua conta</Text>

          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="card-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="CPF"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={cpf}
              onChangeText={(v) => setCpf(maskCPF(v))}
              maxLength={14}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgreed((a) => !a)} activeOpacity={0.8}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              Li e concordo com os <Text style={styles.linkText}>Termos de Uso e Política de Privacidade</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, (!agreed || loading) && styles.primaryButtonDisabled]}
            disabled={!agreed || loading}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Cadastrar</Text>}
          </TouchableOpacity>

          {!!errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadow,
  },
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
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, marginTop: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkboxText: { flex: 1, fontSize: 12.5, color: colors.textMuted, lineHeight: 18 },
  linkText: { color: colors.blue, fontWeight: '600' },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginTop: -8,
    marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 12.5, flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 13 },
  footerLink: { color: colors.blue, fontSize: 13, fontWeight: '700' },
});
