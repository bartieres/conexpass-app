import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';
import { getPlanosDisponiveis } from '../../services/planoService';

function formatarMoeda(valor) {
  if (valor == null) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Tabela comparativa dos planos disponíveis. Uma linha por plano, com o
 * plano atual destacado.
 */
function PlanRow({ plano, isAtual, isSelecionado, onSelect }) {
  return (
    <TouchableOpacity
      style={[styles.planRow, isSelecionado && styles.planRowSelected]}
      onPress={() => onSelect(plano)}
      disabled={isAtual}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1.4 }}>
        <View style={styles.planRowNameRow}>
          <Text style={styles.planRowName}>{plano.nome}</Text>
          {isAtual && (
            <View style={styles.currentTag}>
              <Text style={styles.currentTagText}>Atual</Text>
            </View>
          )}
        </View>
        <Text style={styles.planRowChecking}>{plano.checkinsPorDia}x check-in/dia</Text>
      </View>
      <Text style={[styles.planRowCell, { flex: 1, textAlign: 'right' }]}>{formatarMoeda(plano.valor)}</Text>
      <View style={{ width: 28, alignItems: 'flex-end' }}>
        {isSelecionado && !isAtual && <Ionicons name="checkmark-circle" size={20} color={colors.blue} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ChangePlanScreen({ route, navigation }) {
  const planoAtual = route?.params?.planoAtual;

  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const buscarPlanos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: confirmar endpoint/formato exato no backend
      const data = await getPlanosDisponiveis();
      setPlanos(data);
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar os planos disponíveis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarPlanos();
  }, [buscarPlanos]);

  const handleSelecionar = (plano) => {
    setPlanoSelecionado(plano);
    setConfirmVisible(true);
    setConfirmError('');
  };

  const diferenca = planoSelecionado && planoAtual ? planoSelecionado.valor - planoAtual.valor : 0;

  const handleConfirmar = async () => {
    if (!planoSelecionado) return;
    setConfirming(true);
    setConfirmError('');
    try {
      // TODO: confirmar contrato do endpoint (proporcional, data de vigência, etc.)
      await planoService.alterarPlano({ novoplanoId: planoSelecionado.id });
      setConfirmVisible(false);
      navigation.goBack();
    } catch (err) {
      setConfirmError(err.friendlyMessage || 'Não foi possível alterar seu plano. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alterar plano</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          Compare os planos disponíveis e escolha o que melhor se encaixa no seu uso.
        </Text>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.stateButton} onPress={buscarPlanos}>
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, { flex: 1.4 }]}>Plano</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Valor</Text>
              <View style={{ width: 28 }} />
            </View>

            {planos.map((plano, index) => (
              <PlanRow
                key={plano.id}
                plano={plano}
                isAtual={planoAtual?.id ? plano.id === planoAtual.id : plano.nome === planoAtual?.nome}
                isSelecionado={planoSelecionado?.id === plano.id}
                onSelect={handleSelecionar}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Confirmação da troca */}
      <Modal visible={confirmVisible} animationType="slide" transparent onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirmar alteração de plano?</Text>

            {planoSelecionado && (
              <>
                <Text style={styles.modalText}>
                  Seu plano será alterado para <Text style={styles.modalBold}>{planoSelecionado.nome}</Text>. A nova
                  mensalidade será de <Text style={styles.modalBold}>{formatarMoeda(planoSelecionado.valor)}</Text>.
                </Text>

                <View style={styles.compareBox}>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Plano atual</Text>
                    <Text style={styles.compareValue}>{planoAtual?.nome}</Text>
                  </View>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Novo plano</Text>
                    <Text style={styles.compareValue}>{planoSelecionado.nome}</Text>
                  </View>
                  <View style={styles.compareDivider} />
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Valor atual</Text>
                    <Text style={styles.compareValue}>{formatarMoeda(planoAtual?.valor)}</Text>
                  </View>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Novo valor</Text>
                    <Text style={styles.compareValue}>{formatarMoeda(planoSelecionado.valor)}</Text>
                  </View>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Diferença</Text>
                    <Text style={[styles.compareValue, diferenca > 0 ? styles.compareUp : styles.compareDown]}>
                      {diferenca > 0 ? '+' : ''}
                      {formatarMoeda(diferenca)}
                    </Text>
                  </View>
                  <View style={styles.compareDivider} />
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Entra em vigor</Text>
                    <Text style={styles.compareValue}>Próximo ciclo</Text>
                  </View>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Próxima cobrança</Text>
                    <Text style={styles.compareValue}>{formatarData(planoAtual?.proximaCobranca?.data)}</Text>
                  </View>
                </View>

                {/* TODO: se a regra de negócio cobrar valor proporcional na troca,
                    mostrar uma linha extra aqui com esse valor calculado pelo backend. */}
              </>
            )}

            {!!confirmError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{confirmError}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setConfirmVisible(false)}
                disabled={confirming}
              >
                <Text style={styles.modalCancelText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmar} disabled={confirming}>
                {confirming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirmar alteração</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 16 },

  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tableCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 6, ...shadow },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  tableHeaderText: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: radius.md,
  },
  planRowSelected: { backgroundColor: '#EEF1FC' },
  planRowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planRowName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  currentTag: { backgroundColor: colors.chipBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  currentTagText: { fontSize: 10.5, fontWeight: '700', color: colors.blue },
  planRowChecking: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  planRowCell: { fontSize: 14, fontWeight: '700', color: colors.text },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 20 },
  modalTitle: { fontSize: 16.5, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalText: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 16 },
  modalBold: { fontWeight: '800', color: colors.text },

  compareBox: { backgroundColor: colors.chipBg, borderRadius: radius.md, padding: 14, marginBottom: 8 },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  compareLabel: { fontSize: 12.5, color: colors.textMuted },
  compareValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  compareUp: { color: '#DC2626' },
  compareDown: { color: colors.success },
  compareDivider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 10,
  },
  errorText: { color: '#DC2626', fontSize: 12.5, flex: 1 },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.text },
  modalConfirmButton: {
    flex: 1.4,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
