import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function maskDate(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d{1,4})$/, '$1/$2');
}

export default function PersonalDataScreen({ navigation }) {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cpf, setCpf] = useState(user?.cpf ? maskCPF(user.cpf) : '');
  const [phone, setPhone] = useState(user?.phone ? maskPhone(user.phone) : '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Busca dados atualizados assim que a tela abre (GET /users/me)
  useEffect(() => {
    (async () => {
      try {
        const profile = await userService.getProfile();
        setName(profile.name || '');
        setEmail(profile.email || '');
        setCpf(profile.cpf ? maskCPF(profile.cpf) : '');
        setPhone(profile.phone ? maskPhone(profile.phone) : '');
        setBirthDate(profile.birthDate || '');
      } catch (err) {
        setErrorMessage(err.friendlyMessage || 'Não foi possível carregar seus dados.');
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Nome e e-mail são obrigatórios.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);
    try {
      await userService.updateProfile({ name, email, phone, birthDate });
      setSuccessMessage('Dados atualizados com sucesso!');
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Não foi possível salvar suas alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome completo</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome completo" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CPF</Text>
          <View style={[styles.inputBox, styles.inputBoxDisabled]}>
            <Ionicons name="card-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} value={cpf} editable={false} />
          </View>
          <Text style={styles.helperText}>O CPF não pode ser alterado.</Text>
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Data de nascimento</Text>
          <View style={styles.inputBox}>
            <Ionicons name="calendar-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(v) => setBirthDate(maskDate(v))}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
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
