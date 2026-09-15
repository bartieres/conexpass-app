import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';
import { findAllByCondition } from '../../services/planoService';
import { alterarPlano } from '../../services/assinaturaService';

const TAMANHO_PAGINA = 50;

function formatarMoeda(valor) {
  if (valor == null) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function calcularDesconto(valorOriginal, valor) {
  if (!valorOriginal || valorOriginal <= valor) return null;
  return Math.round((1 - valor / valorOriginal) * 100);
}

/**
 * Card individual de plano — substitui a linha de tabela anterior. Cada
 * plano ganha destaque próprio (retângulo branco, benefícios listados,
 * preço grande e, quando existir, o desconto "de X por Y").
 */
function PlanCard({ plano, isAtual, onSelect }) {
  const desconto = calcularDesconto(plano.valorOriginal, plano.valor);
  const destacarComoRecomendado = plano.recomendado && !isAtual;

  return (
    <View
      style={[
        styles.planCard,
        isAtual && styles.planCardAtual,
        destacarComoRecomendado && styles.planCardRecomendado,
      ]}
    >
      {destacarComoRecomendado && (
        <View style={styles.recommendedRibbon}>
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.recommendedRibbonText}>Recomendado</Text>
        </View>
      )}

      <View style={styles.planCardHeader}>
        <Text style={styles.planCardName}>{plano.nome}</Text>
        {isAtual && (
          <View style={styles.currentTag}>
            <Text style={styles.currentTagText}>Seu plano atual</Text>
          </View>
        )}
        {!isAtual && !!desconto && (
          <View style={styles.discountTag}>
            <Text style={styles.discountTagText}>-{desconto}%</Text>
          </View>
        )}
      </View>

      <View style={styles.priceRow}>
        {!!plano.valorOriginal && plano.valorOriginal > plano.valor && (
          <Text style={styles.priceOriginal}>
            de {formatarMoeda(plano.valorOriginal)}
          </Text>
        )}
        <Text style={styles.priceValue}>
          {!!plano.valorOriginal && plano.valorOriginal > plano.valor
            ? 'por '
            : ''}
          <Text style={styles.priceValueNumber}>
            {formatarMoeda(plano.valor)}
          </Text>
          <Text style={styles.priceValueSuffix}>/mês</Text>
        </Text>
      </View>

      <View style={styles.checkinRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.blue} />
        <Text style={styles.checkinText}>
          {plano.checkinsPorDia}x check-in por dia
        </Text>
      </View>

      {!!plano.beneficios?.length && (
        <View style={styles.beneficiosList}>
          {plano.beneficios.map((beneficio) => (
            <View key={beneficio} style={styles.beneficioRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text style={styles.beneficioText}>{beneficio}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.selectButton, isAtual && styles.selectButtonAtual]}
        onPress={() => onSelect(plano)}
        disabled={isAtual}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.selectButtonText,
            isAtual && styles.selectButtonTextAtual,
          ]}
        >
          {isAtual ? 'Plano atual' : 'Selecionar plano'}
        </Text>
      </TouchableOpacity>
    </View>
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
  const [success, setSuccess] = useState(false);

  const buscarPlanos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const pages = {
        orderBy: 'nivel',
        size: TAMANHO_PAGINA,
      };

      const data = await findAllByCondition({ ...pages });
      const response = data.response;

      const formatted = response.content.map((e) => {
        return {
          id: e.id,
          nome: `Plano ${e.nome}`,
          descricao: e.descricao,
          valor: e.valor,
          valorOriginal: e.valorOriginal ?? null,
          recomendado: e.recomendado ?? false,
          checkinsPorDia: e.limiteCheckinDia,
          dataContratacao: e.dataContratacao,
          beneficios: e.beneficios,
          nivel: e.nivel,
        };
      });

      // Fallback: se nenhum plano veio marcado como recomendado pelo
      // backend, destaca o de preço "do meio" (nem o mais barato, nem o
      // mais caro) — critério fácil de trocar depois por outra regra.
      const algumRecomendadoPeloBackend = formatted.some(
        (p) => p.recomendado === true
      );
      if (!algumRecomendadoPeloBackend && formatted.length > 2) {
        const ordenadosPorValor = [...formatted].sort(
          (a, b) => a.valor - b.valor
        );
        const idDoMeio =
          ordenadosPorValor[Math.floor(ordenadosPorValor.length / 2)].id;
        formatted.forEach((p) => {
          p.recomendado = p.id === idDoMeio;
        });
      } else {
        formatted.forEach((p) => {
          p.recomendado = p.recomendado === true;
        });
      }

      setPlanos(formatted);
    } catch (err) {
      setError(
        err.friendlyMessage ||
          'Não foi possível carregar os planos disponíveis.'
      );
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

  const diferenca =
    planoSelecionado && planoAtual
      ? planoSelecionado.valor - planoAtual.valor
      : 0;

  const handleConfirmar = async () => {
    if (!planoSelecionado) return;
    setConfirming(true);
    setConfirmError('');
    try {
      const payload = {
        planoAtual: planoAtual,
        planoNovo: {
          id: planoSelecionado.id,
          valor: planoSelecionado.valor,
          nivel: planoSelecionado.nivel,
        },
      };

      await alterarPlano(payload);

      setConfirmVisible(false);
      setSuccess(true);
    } catch (err) {
      setConfirmError(
        err.friendlyMessage ||
          'Não foi possível alterar seu plano. Tente novamente.'
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alterar plano</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {success ? (
          <View style={styles.successBox}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={colors.success}
            />

            <Text style={styles.successTitle}>
              {planoAtual ? 'Plano alterado!' : 'Assinatura contratada!'}
            </Text>

            <Text style={styles.successText}>
              {planoAtual
                ? `Você agora está no ${planoSelecionado?.nome}.`
                : `Você contratou o ${planoSelecionado?.nome} com sucesso.`}
            </Text>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.successButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.intro}>
              Compare os planos disponíveis e escolha o que melhor se encaixa no
              seu uso.
            </Text>

            {loading && (
              <View style={styles.stateBox}>
                <ActivityIndicator size="small" color={colors.blue} />
              </View>
            )}

            {!loading && !!error && (
              <View style={styles.stateBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={26}
                  color="#DC2626"
                />

                <Text style={styles.stateText}>{error}</Text>

                <TouchableOpacity
                  style={styles.stateButton}
                  onPress={buscarPlanos}
                >
                  <Text style={styles.stateButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && (
              <View style={styles.plansList}>
                {planos.map((plano) => (
                  <PlanCard
                    key={plano.id}
                    plano={plano}
                    isAtual={
                      planoAtual?.id
                        ? plano.id === planoAtual.id
                        : plano.nome === planoAtual?.nome
                    }
                    onSelect={handleSelecionar}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Confirmação da troca */}
      <Modal
        visible={confirmVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirmar alteração de plano?</Text>

            {planoSelecionado && (
              <>
                <Text style={styles.modalText}>
                  Seu plano será alterado para{' '}
                  <Text style={styles.modalBold}>{planoSelecionado.nome}</Text>.
                  A nova mensalidade será de{' '}
                  <Text style={styles.modalBold}>
                    {formatarMoeda(planoSelecionado.valor)}
                  </Text>
                  .
                </Text>

                <View style={styles.compareBox}>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Plano atual</Text>
                    <Text style={styles.compareValue}>
                      {planoAtual?.nome ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Novo plano</Text>
                    <Text style={styles.compareValue}>
                      {planoSelecionado.nome}
                    </Text>
                  </View>
                  <View style={styles.compareDivider} />
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Valor atual</Text>
                    <Text style={styles.compareValue}>
                      {planoAtual ? formatarMoeda(planoAtual.valor) : '—'}
                    </Text>
                  </View>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Novo valor</Text>
                    <Text style={styles.compareValue}>
                      {formatarMoeda(planoSelecionado.valor)}
                    </Text>
                  </View>
                  {!!planoAtual && (
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Diferença</Text>
                      <Text
                        style={[
                          styles.compareValue,
                          diferenca > 0 ? styles.compareUp : styles.compareDown,
                        ]}
                      >
                        {diferenca > 0 ? '+' : ''}
                        {formatarMoeda(diferenca)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.compareDivider} />
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>Entra em vigor</Text>
                    <Text style={styles.compareValue}>
                      {planoAtual ? 'Próximo ciclo' : 'Imediatamente'}
                    </Text>
                  </View>
                  {!!planoAtual?.proximaCobranca?.data && (
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Próxima cobrança</Text>
                      <Text style={styles.compareValue}>
                        {formatarData(planoAtual.proximaCobranca.data)}
                      </Text>
                    </View>
                  )}
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
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmar}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    Confirmar alteração
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  intro: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 18,
  },

  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  plansList: { gap: 16 },

  planCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    ...shadow,
  },
  planCardAtual: { borderColor: colors.blue, backgroundColor: '#F7F9FF' },
  planCardRecomendado: { borderColor: '#F59E0B', paddingTop: 34 },

  recommendedRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
  },
  recommendedRibbonText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  currentTag: {
    backgroundColor: colors.blue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  currentTagText: { fontSize: 10.5, fontWeight: '700', color: '#fff' },
  discountTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  discountTagText: { fontSize: 11, fontWeight: '800', color: '#DC2626' },

  priceRow: { marginBottom: 12 },
  priceOriginal: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  priceValue: { fontSize: 13, color: colors.textMuted },
  priceValueNumber: { fontSize: 26, fontWeight: '800', color: colors.text },
  priceValueSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },

  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.chipBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 14,
  },
  checkinText: { fontSize: 12, fontWeight: '600', color: colors.blue },

  beneficiosList: { gap: 8, marginBottom: 18 },
  beneficioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  beneficioText: { fontSize: 13, color: colors.text, flex: 1 },

  selectButton: {
    backgroundColor: colors.blue,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonAtual: { backgroundColor: colors.chipBg },
  selectButtonText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  selectButtonTextAtual: { color: colors.blue },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 16,
  },
  modalBold: { fontWeight: '800', color: colors.text },

  compareBox: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  compareLabel: { fontSize: 12.5, color: colors.textMuted },
  compareValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  compareUp: { color: '#DC2626' },
  compareDown: { color: colors.success },
  compareDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },

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
  successBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 14,
    textAlign: 'center',
  },

  successText: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 320,
  },

  successButton: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: 24,
  },

  successButtonText: {
    color: colors.blue,
    fontWeight: '700',
    fontSize: 14,
  },
});
