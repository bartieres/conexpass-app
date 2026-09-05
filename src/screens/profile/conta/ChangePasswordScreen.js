import React, { useState, useMemo } from 'react';
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
import { colors, radius, shadow } from '../../../theme/theme';
import { userService } from '../../../services/userService';

const MIN_LENGTH = 8;

// Regras de validação da nova senha. Cada regra recebe a senha (e, quando
// necessário, a confirmação) e devolve se está satisfeita — usado tanto pro
// checklist visual quanto pra travar o botão de salvar.
function buildRules(newPassword, confirmPassword) {
  return [
    {
      id: 'length',
      label: `Mínimo de ${MIN_LENGTH} caracteres`,
      valid: newPassword.length >= MIN_LENGTH,
    },
    {
      id: 'letter',
      label: 'Pelo menos uma letra',
      valid: /[a-zA-Z]/.test(newPassword),
    },
    {
      id: 'number',
      label: 'Pelo menos um número',
      valid: /\d/.test(newPassword),
    },
    {
      id: 'match',
      label: 'Senhas coincidem',
      valid: newPassword.length > 0 && newPassword === confirmPassword,
    },
  ];
}

function PasswordField({ label, value, onChangeText, visible, onToggleVisible, placeholder }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggleVisible} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RuleChecklist({ rules }) {
  return (
    <View style={styles.rulesBox}>
      {rules.map((rule) => (
        <View key={rule.id} style={styles.ruleRow}>
          <Ionicons
            name={rule.valid ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={rule.valid ? colors.success : colors.textLight}
          />
          <Text style={[styles.ruleText, rule.valid && styles.ruleTextValid]}>{rule.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const rules = useMemo(() => buildRules(newPassword, confirmPassword), [newPassword, confirmPassword]);
  const allRulesValid = rules.every((rule) => rule.valid);
  const canSave = currentPassword.length > 0 && allRulesValid && !saving;

  const handleSave = async () => {
    if (!currentPassword) {
      setErrorMessage('Informe sua senha atual.');
      return;
    }
    if (!allRulesValid) {
      setErrorMessage('A nova senha ainda não atende a todos os requisitos.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);
    try {
      // TODO: confirmar o nome/formato exato do endpoint no backend
      // (ex: PATCH /users/me/password)
      await userService.changePassword({ currentPassword, newPassword });

      setSuccessMessage('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Não foi possível alterar sua senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alterar senha</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <PasswordField
          label="Senha atual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          visible={showCurrent}
          onToggleVisible={() => setShowCurrent((v) => !v)}
          placeholder="Digite sua senha atual"
        />

        <PasswordField
          label="Nova senha"
          value={newPassword}
          onChangeText={setNewPassword}
          visible={showNew}
          onToggleVisible={() => setShowNew((v) => !v)}
          placeholder="Digite a nova senha"
        />

        <PasswordField
          label="Confirmar nova senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          visible={showConfirm}
          onToggleVisible={() => setShowConfirm((v) => !v)}
          placeholder="Digite a nova senha novamente"
        />

        <RuleChecklist rules={rules} />

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

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar nova senha</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
    gap: 8,
  },
  inputIcon: { marginRight: 0 },
  input: { flex: 1, fontSize: 14, color: colors.text },
  rulesBox: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontSize: 12.5, color: colors.textMuted },
  ruleTextValid: { color: colors.success, fontWeight: '600' },
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
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
