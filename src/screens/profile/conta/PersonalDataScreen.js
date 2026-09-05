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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, typography } from '../../../theme/theme';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services/userService';

function maskCPF(value = '') {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value = '') {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// Data de nascimento vem do backend, não é digitada pelo usuário (campo não
// editável). Aceita tanto 'YYYY-MM-DD' quanto já formatada, e não quebra se
// vier vazia.
function formatBirthDate(value) {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, ano, mes, dia] = match;
    return `${dia}/${mes}/${ano}`;
  }
  return value;
}

// Sexo pode vir como string simples ('M') ou como objeto { codigo, descricao },
// dependendo de como o backend serializa. Cobrindo os dois formatos.
function formatSexo(sexo) {
  if (!sexo) return '';
  if (typeof sexo === 'string') {
    if (sexo === 'M') return 'Masculino';
    if (sexo === 'F') return 'Feminino';
    return sexo;
  }
  return sexo.descricao || sexo.codigo || '';
}

// Campo somente leitura, com o mesmo visual dos inputs editáveis, mas sem
// permitir edição (nome, data de nascimento, sexo, CPF e e-mail).
function ReadOnlyField({ icon, label, value }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, styles.inputBoxDisabled]}>
        <Ionicons name={icon} size={18} color={colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} value={value} editable={false} />
      </View>
    </View>
  );
}

export default function PersonalDataScreen({ navigation }) {
  // Dados do usuário autenticado vêm direto do AuthContext — sem novo fetch
  // aqui, já que o login/carregamento inicial da sessão é quem popula isso.
  const { user, updateUser } = useAuth();

  // Único campo editável nessa tela
  const [phone, setPhone] = useState(user?.telefone ? maskPhone(user.telefone) : '');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);
    try {
      const updated = await userService.updateProfile({ phone });

      // Mantém o AuthContext em dia com o telefone novo, sem precisar
      // recarregar o usuário inteiro do backend.
      updateUser?.({ phone: updated?.phone ?? phone });

      setSuccessMessage('Telefone atualizado com sucesso!');
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Não foi possível salvar suas alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, styles.centerAll]}>
        <ActivityIndicator size="small" color={colors.blue} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dados pessoais</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <ReadOnlyField icon="person-outline" label="Nome completo" value={user.nome} />
        <ReadOnlyField icon="mail-outline" label="E-mail" value={user.email} />
        <ReadOnlyField icon="card-outline" label="CPF" value={user.documento} />
        {/* <ReadOnlyField icon="calendar-outline" label="Data de nascimento" value={formatBirthDate(user.birthDate)} /> */}
        <ReadOnlyField icon="body-outline" label="Sexo" value={formatSexo(user.sexo)} />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <View style={styles.inputBox}>
            <Ionicons name="call-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(v) => setPhone(maskPhone(v))}
              placeholder="(00) 00000-0000"
              keyboardType="numeric"
              maxLength={15}
            />
          </View>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        {!!successMessage && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar alterações</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  centerAll: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  body: { padding: 20, paddingTop: 4 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 50,
  },
  inputBoxDisabled: { backgroundColor: '#F1F3F8' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: colors.text },
  helperText: { fontSize: 11.5, color: colors.textLight, marginTop: 4 },
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 14,
  },
  successText: { color: colors.success, fontSize: 12.5, flex: 1, fontWeight: '600' },
  saveButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
