import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';

export default function SuggestEstablishmentModal({ visible, onClose, onSubmit, sending, error, success }) {
  const [nome, setNome] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [endereco, setEndereco] = useState('');

  const podeEnviar = nome.trim().length > 0 && cidade.trim().length > 0 && !sending;

  const limpar = () => {
    setNome('');
    setEstado('');
    setCidade('');
    setEndereco('');
  };

  const handleClose = () => {
    limpar();
    onClose();
  };

  const handleEnviar = () => {
    onSubmit({
      nome: nome.trim(),
      estado: estado.trim().toUpperCase(),
      cidade: cidade.trim(),
      endereco: endereco.trim() || undefined,
    });
  };

  // Depois de enviar com sucesso, limpa o formulário pra uma próxima sugestão
  // (o pai decide quando fechar o modal / mostrar a confirmação)
  React.useEffect(() => {
    if (success) limpar();
  }, [success]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Indicar estabelecimento</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Não encontrou o estabelecimento que procura? Nos conte onde você gostaria de treinar e vamos avaliar
              a parceria.
            </Text>

            {success ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                <Text style={styles.successText}>
                  Recebemos sua indicação! Vamos avaliar a possibilidade de parceria com esse estabelecimento.
                </Text>
                <TouchableOpacity style={styles.successButton} onPress={handleClose}>
                  <Text style={styles.successButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome do estabelecimento *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Academia Fit Center"
                    placeholderTextColor={colors.textLight}
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Estado (UF)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="PR"
                      placeholderTextColor={colors.textLight}
                      value={estado}
                      onChangeText={setEstado}
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={styles.label}>Cidade *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Londrina"
                      placeholderTextColor={colors.textLight}
                      value={cidade}
                      onChangeText={setCidade}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Endereço completo</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Rua, número, bairro — o que você souber já ajuda"
                    placeholderTextColor={colors.textLight}
                    value={endereco}
                    onChangeText={setEndereco}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {!!error && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, !podeEnviar && styles.submitButtonDisabled]}
                  onPress={handleEnviar}
                  disabled={!podeEnviar}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Enviar indicação</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  body: { padding: 20 },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: colors.text,
  },
  textArea: { height: 80, paddingTop: 12 },
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
  submitButton: {
    backgroundColor: colors.blue,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  successBox: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  successText: { fontSize: 13.5, color: colors.text, textAlign: 'center', lineHeight: 19 },
  successButton: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: 4,
  },
  successButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },
});
