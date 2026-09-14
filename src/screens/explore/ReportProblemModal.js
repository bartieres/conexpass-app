import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/theme';

// Motivos exibidos no relatório de problema. Ajuste os textos livremente —
// só o "value" de cada um é o que vai pro backend.
const MOTIVOS = [
  { value: 'NAO_ACEITA_MAIS', label: 'Não aceita mais o ConexPass' },
  { value: 'TAXA_EXTRA', label: 'Me cobraram uma taxa extra' },
  { value: 'INFO_INCORRETA', label: 'As informações no aplicativo estão incorretas' },
  { value: 'OUTRO', label: 'Outro' },
];

export default function ReportProblemModal({ visible, onClose, onSubmit, sending, error }) {
  const [motivoSelecionado, setMotivoSelecionado] = useState(null);
  const [descricao, setDescricao] = useState('');

  const mostrarCampoTexto = motivoSelecionado === 'OUTRO';
  const podeEnviar = !!motivoSelecionado && (!mostrarCampoTexto || descricao.trim().length > 0) && !sending;

  const handleClose = () => {
    setMotivoSelecionado(null);
    setDescricao('');
    onClose();
  };

  const handleEnviar = () => {
    onSubmit({ motivo: motivoSelecionado, descricao: descricao.trim() || undefined });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reportar um problema</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Por favor, conte-nos o que aconteceu</Text>
          <Text style={styles.subtitle}>Não compartilharemos essa informação com o estabelecimento.</Text>

          <View style={styles.optionsList}>
            {MOTIVOS.map((motivo) => {
              const selecionado = motivo.value === motivoSelecionado;
              return (
                <TouchableOpacity
                  key={motivo.value}
                  style={styles.optionRow}
                  onPress={() => setMotivoSelecionado(motivo.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, selecionado && styles.radioActive]}>
                    {selecionado && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.optionLabel}>{motivo.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mostrarCampoTexto && (
            <TextInput
              style={styles.textArea}
              placeholder="Descreva o que aconteceu..."
              placeholderTextColor={colors.textLight}
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !podeEnviar && styles.submitButtonDisabled]}
            onPress={handleEnviar}
            disabled={!podeEnviar}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Enviar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: 54 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingBottom: 20,
    position: 'relative',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', lineHeight: 28 },
  subtitle: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: 14, marginBottom: 30, lineHeight: 19 },
  optionsList: { gap: 26 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.blue },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.blue },
  optionLabel: { fontSize: 16, color: colors.text, flex: 1 },
  textArea: {
    marginTop: 24,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 16,
  },
  errorText: { color: '#DC2626', fontSize: 12.5, flex: 1 },
  footer: { padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: colors.chipBg },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
