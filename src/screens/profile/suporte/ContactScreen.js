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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../../theme/theme';
import { supportService } from '../../../services/suporteService';

const MAX_MENSAGEM = 500;

// Lista de assuntos. Pra adicionar um novo, é só incluir aqui.
const ASSUNTOS = [
  { id: 'checkin-recusado', label: 'Meu check-in foi recusado.' },
  { id: 'cobranca-sem-uso', label: 'Fui cobrado e não consegui utilizar o plano.' },
  { id: 'pagamento', label: 'Problema com pagamento ou cobrança indevida.' },
  { id: 'plano', label: 'Dúvidas sobre meu plano ou assinatura.' },
  { id: 'cancelamento', label: 'Cancelamento de conta.' },
  { id: 'sugestao-estabelecimento', label: 'Sugestão de estabelecimento parceiro.' },
  { id: 'problema-tecnico', label: 'Problema técnico no aplicativo.' },
  { id: 'outro', label: 'Outro assunto.' },
];

function SubjectPickerModal({ visible, selectedId, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o assunto</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {ASSUNTOS.map((assunto) => {
              const active = assunto.id === selectedId;
              return (
                <TouchableOpacity
                  key={assunto.id}
                  style={styles.modalOption}
                  onPress={() => onSelect(assunto.id)}
                >
                  <Text style={styles.modalOptionText}>{assunto.label}</Text>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ContactScreen({ navigation }) {
  const [assuntoId, setAssuntoId] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const assuntoSelecionado = ASSUNTOS.find((a) => a.id === assuntoId);
  const canSend = !!assuntoId && mensagem.trim().length >= 10 && !sending;

  const handleSelectAssunto = (id) => {
    setAssuntoId(id);
    setModalVisible(false);
  };

  const handleSend = async () => {
    if (!assuntoId) {
      setErrorMessage('Selecione um assunto.');
      return;
    }
    if (mensagem.trim().length < 10) {
      setErrorMessage('Conte um pouco mais sobre o que aconteceu (mínimo de 10 caracteres).');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setSending(true);
    try {
      // TODO: confirmar o formato exato esperado pelo endpoint de suporte
      await supportService.sendMessage({ assunto: assuntoId, mensagem: mensagem.trim() });

      setSuccessMessage('Mensagem enviada! Nossa equipe vai te responder em breve.');
      setAssuntoId(null);
      setMensagem('');
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Não foi possível enviar sua mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fale conosco</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.heroTitle}>Precisa de ajuda?</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Assunto</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setModalVisible(true)}>
            <Text style={[styles.selectText, !assuntoSelecionado && styles.selectPlaceholder]} numberOfLines={1}>
              {assuntoSelecionado ? assuntoSelecionado.label : 'Selecione o assunto'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.messageLabelRow}>
            <Text style={styles.label}>Mensagem</Text>
            <Text style={styles.counterText}>
              {mensagem.length}/{MAX_MENSAGEM}
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            value={mensagem}
            onChangeText={setMensagem}
            placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={6}
            maxLength={MAX_MENSAGEM}
            textAlignVertical="top"
          />
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

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Enviar mensagem</Text>}
        </TouchableOpacity>
      </ScrollView>

      <SubjectPickerModal
        visible={modalVisible}
        selectedId={assuntoId}
        onSelect={handleSelectAssunto}
        onClose={() => setModalVisible(false)}
      />
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
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 50,
  },
  selectText: { flex: 1, fontSize: 14, color: colors.text, marginRight: 8 },
  selectPlaceholder: { color: colors.textLight },
  messageLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterText: { fontSize: 11.5, color: colors.textLight },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    minHeight: 140,
  },
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
  sendButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 6,
  },
  modalTitle: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  modalOptionText: { flex: 1, fontSize: 14, color: colors.text },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.blue },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
});
