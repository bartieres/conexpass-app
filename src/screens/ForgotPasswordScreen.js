import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSend = async () => {
    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.card}>
          {!sent ? (
            <>
              <Text style={styles.title}>Esqueci minha senha</Text>
              <Text style={styles.subtitle}>Informe seu e-mail para receber o link de redefinição</Text>

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

              {!!errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={handleSend} activeOpacity={0.85} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Enviar link</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="mail-open-outline" size={44} color={colors.blue} style={{ marginBottom: 14 }} />
              <Text style={styles.title}>E-mail enviado!</Text>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>
                Verifique sua caixa de entrada para redefinir sua senha.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.primaryButtonText}>Voltar ao login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 22, ...shadow },
  title: { ...typography.h2, marginBottom: 6 },
  subtitle: { ...typography.muted, marginBottom: 20 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: colors.text },
  primaryButton: { backgroundColor: colors.blue, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 14,
  },
  errorText: { color: '#DC2626', fontSize: 12.5, flex: 1 },
});
