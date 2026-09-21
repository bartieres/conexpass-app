import { useState, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow } from '../../theme/theme';

import { alterarPlano } from '../../services/assinaturaService';

import {
  findCreditCardPrincipalByUsuario,
} from '../../services/formaPagamentoService';

function formatarMoeda(valor) {
  if (valor == null) return '';

  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
  if (!dataISO) return '';

  const [ano, mes, dia] = dataISO.split('-');

  return `${dia}/${mes}/${ano}`;
}

function obterUltimosDigitos(formaPagamento) {
  return (
    formaPagamento?.ultimosDigitos ??
    formaPagamento?.numeroFinal ??
    formaPagamento?.finalCartao ??
    formaPagamento?.last4 ??
    '••••'
  );
}

function obterBandeira(formaPagamento) {
  return (
    formaPagamento?.bandeira ??
    formaPagamento?.brand ??
    formaPagamento?.tipoBandeira ??
    'Cartão'
  );
}

function obterDescricaoFormaPagamento(formaPagamento) {
  if (!formaPagamento) return '';

  const tipo =
    formaPagamento.tipo ??
    formaPagamento.tipoPagamento ??
    'Cartão de crédito';

  return tipo;
}

function PaymentMethodCard({
  formaPagamento,
  onChange,
  onAdd,
}) {
  if (!formaPagamento) {
    return (
      <View style={styles.paymentEmptyCard}>
        <View style={styles.paymentEmptyIcon}>
          <Ionicons
            name="card-outline"
            size={24}
            color={colors.blue}
          />
        </View>

        <View style={styles.paymentEmptyContent}>
          <Text style={styles.paymentEmptyTitle}>
            Forma de pagamento
          </Text>

          <Text style={styles.paymentEmptyText}>
            Você ainda não possui uma forma de pagamento
            cadastrada.
          </Text>

          <Text style={styles.paymentEmptyHint}>
            Cadastre um cartão para continuar com sua
            assinatura.
          </Text>

          <TouchableOpacity
            style={styles.addPaymentButton}
            onPress={onAdd}
            activeOpacity={0.85}
          >
            <Ionicons
              name="add"
              size={18}
              color={colors.blue}
            />

            <Text style={styles.addPaymentButtonText}>
              Cadastrar cartão
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentCardHeader}>
        <View style={styles.paymentIcon}>
          <Ionicons
            name="card"
            size={22}
            color={colors.blue}
          />
        </View>

        <View style={styles.paymentCardTitleContainer}>
          <Text style={styles.paymentCardTitle}>
            Forma de pagamento
          </Text>

          <Text style={styles.paymentCardSubtitle}>
            Usada para sua assinatura
          </Text>
        </View>

        <TouchableOpacity
          onPress={onChange}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <Text style={styles.changePaymentText}>
            Alterar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardPreview}>
        <View style={styles.cardBrandRow}>
          <Text style={styles.cardBrand}>
            {obterBandeira(formaPagamento)}
          </Text>

          <Ionicons
            name="card-outline"
            size={20}
            color={colors.textMuted}
          />
        </View>

        <Text style={styles.cardNumber}>
          •••• •••• •••• {obterUltimosDigitos(formaPagamento)}
        </Text>

        <Text style={styles.cardType}>
          {obterDescricaoFormaPagamento(formaPagamento)}
        </Text>
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  divider,
}) {
  return (
    <>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.summaryValue,
            highlight && styles.summaryValueHighlight,
          ]}
        >
          {value}
        </Text>
      </View>

      {divider && (
        <View style={styles.summaryDivider} />
      )}
    </>
  );
}

export default function ReviewPlanScreen({
  route,
  navigation,
}) {
  const planoAtual = route?.params?.planoAtual;

  const planoSelecionado =
    route?.params?.planoSelecionado;

  const [formaPagamento, setFormaPagamento] =
    useState(null);

  const [loadingPayment, setLoadingPayment] =
    useState(true);

  const [paymentError, setPaymentError] =
    useState('');

  const [confirming, setConfirming] =
    useState(false);

  const [confirmError, setConfirmError] =
    useState('');

  const [sucesso, setSucesso] =
    useState(false);

  const buscarFormaPagamento = useCallback(
    async () => {
      setLoadingPayment(true);
      setPaymentError('');

      try {
        const { response } =
          await findCreditCardPrincipalByUsuario();

        const data = {
          ultimosDigitos:
            response.cartao.ultimosDigitos,

          bandeira:
            response.cartao.bandeira,

          validade:
            response.cartao.validade,
        };

        setFormaPagamento(data);
      } catch (err) {
        if (
          err?.response?.status === 404 ||
          err?.status === 404
        ) {
          setFormaPagamento(null);
        } else {
          setPaymentError(
            err?.friendlyMessage ||
              'Não foi possível carregar sua forma de pagamento.'
          );
        }
      } finally {
        setLoadingPayment(false);
      }
    },
    []
  );

  useEffect(() => {
    buscarFormaPagamento();
  }, [buscarFormaPagamento]);

  const diferenca =
    planoAtual && planoSelecionado
      ? Number(planoSelecionado.valor) -
        Number(planoAtual.valor)
      : Number(planoSelecionado?.valor ?? 0);

  const isUpgrade = diferenca > 0;

  const isDowngrade = diferenca < 0;

  const handleCadastrarCartao = () => {
    navigation.navigate('PaymentMethod', {
      returnTo: 'ReviewPlan',
    });
  };

  const handleAlterarFormaPagamento = () => {
    navigation.navigate('PaymentMethod', {
      returnTo: 'ReviewPlan',
    });
  };

  const handleConfirmar = async () => {
    if (!planoSelecionado) {
      return;
    }

    if (!formaPagamento) {
      setConfirmError(
        'Cadastre uma forma de pagamento para continuar.'
      );

      return;
    }

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

      setSucesso(true);
    } catch (err) {
      setConfirmError(
        err?.friendlyMessage ||
          'Não foi possível concluir a alteração. Tente novamente.'
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleVoltarParaPlanos = () => {
    navigation.popToTop();
  };

  if (!planoSelecionado) {
    return (
      <View style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Revisar assinatura
          </Text>

          <View style={{ width: 38 }} />
        </View>

        <View style={styles.invalidState}>
          <Ionicons
            name="alert-circle-outline"
            size={36}
            color="#DC2626"
          />

          <Text style={styles.invalidStateTitle}>
            Não foi possível carregar o plano.
          </Text>

          <TouchableOpacity
            style={styles.stateButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.stateButtonText}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (sucesso) {
    return (
      <View style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark"
                size={42}
                color="#fff"
              />
            </View>
          </View>

          <Text style={styles.successTitle}>
            {planoAtual
              ? 'Plano alterado com sucesso!'
              : 'Assinatura realizada com sucesso!'}
          </Text>

          <Text style={styles.successDescription}>
            {planoAtual
              ? 'Seu plano foi alterado e a nova assinatura já está registrada.'
              : 'Sua assinatura foi realizada e o plano já está registrado na sua conta.'}
          </Text>

          <View style={styles.successPlanCard}>
            <View style={styles.successPlanIcon}>
              <Ionicons
                name="fitness-outline"
                size={23}
                color={colors.blue}
              />
            </View>

            <View style={styles.successPlanContent}>
              <Text style={styles.successPlanLabel}>
                {planoAtual
                  ? 'Novo plano'
                  : 'Plano contratado'}
              </Text>

              <Text style={styles.successPlanName}>
                {planoSelecionado.nome}
              </Text>

              <Text style={styles.successPlanCheckins}>
                {planoSelecionado.checkinsPorDia}x
                {' '}check-in por dia
              </Text>

              <Text style={styles.successPlanPrice}>
                {formatarMoeda(
                  planoSelecionado.valor
                )}

                <Text style={styles.successPlanSuffix}>
                  {' '}/mês
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.successInfoBox}>
            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color={colors.success}
            />

            <Text style={styles.successInfoText}>
              Você já pode continuar usando o
              ConexPass normalmente.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.successButton}
            onPress={handleVoltarParaPlanos}
            activeOpacity={0.85}
          >
            <Text style={styles.successButtonText}>
              Voltar para planos
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Revisar assinatura
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Confira os detalhes da sua assinatura antes de
          confirmar.
        </Text>

        {/* PLANO */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Plano escolhido
          </Text>

          <View style={styles.planSummaryCard}>
            <View style={styles.planSummaryIcon}>
              <Ionicons
                name="fitness-outline"
                size={22}
                color={colors.blue}
              />
            </View>

            <View style={styles.planSummaryContent}>
              <Text style={styles.planSummaryName}>
                {planoSelecionado.nome}
              </Text>

              <Text style={styles.planSummaryCheckins}>
                {planoSelecionado.checkinsPorDia}x
                {' '}check-in por dia
              </Text>

              {!!planoSelecionado.descricao && (
                <Text
                  style={styles.planSummaryDescription}
                >
                  {planoSelecionado.descricao}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* RESUMO */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Resumo da alteração
          </Text>

          <View style={styles.summaryCard}>
            {planoAtual && (
              <>
                <SummaryRow
                  label="Plano atual"
                  value={planoAtual.nome}
                />

                <SummaryRow
                  label="Valor atual"
                  value={`${formatarMoeda(
                    planoAtual.valor
                  )}/mês`}
                  divider
                />
              </>
            )}

            <SummaryRow
              label="Novo plano"
              value={planoSelecionado.nome}
            />

            <SummaryRow
              label="Novo valor"
              value={`${formatarMoeda(
                planoSelecionado.valor
              )}/mês`}
              highlight
              divider
            />

            {planoAtual && (
              <SummaryRow
                label="Diferença"
                value={`${
                  diferenca > 0 ? '+' : ''
                }${formatarMoeda(
                  diferenca
                )}/mês`}
              />
            )}

            <SummaryRow
              label="Entra em vigor"
              value={
                planoAtual
                  ? 'Próximo ciclo'
                  : 'Imediatamente'
              }
              divider
            />

            {!!planoAtual?.proximaCobranca?.data && (
              <SummaryRow
                label="Próxima cobrança"
                value={formatarData(
                  planoAtual.proximaCobranca.data
                )}
              />
            )}
          </View>
        </View>

        {/* FORMA DE PAGAMENTO */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Forma de pagamento
          </Text>

          {loadingPayment && (
            <View style={styles.paymentLoading}>
              <ActivityIndicator
                size="small"
                color={colors.blue}
              />

              <Text style={styles.paymentLoadingText}>
                Carregando forma de pagamento...
              </Text>
            </View>
          )}

          {!loadingPayment && !!paymentError && (
            <View style={styles.paymentErrorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="#DC2626"
              />

              <View style={styles.paymentErrorContent}>
                <Text style={styles.paymentErrorText}>
                  {paymentError}
                </Text>

                <TouchableOpacity
                  onPress={buscarFormaPagamento}
                >
                  <Text
                    style={styles.paymentRetryText}
                  >
                    Tentar novamente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!loadingPayment &&
            !paymentError && (
              <PaymentMethodCard
                formaPagamento={formaPagamento}
                onAdd={handleCadastrarCartao}
                onChange={
                  handleAlterarFormaPagamento
                }
              />
            )}
        </View>

        {/* TOTAL */}

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>
              Total da assinatura
            </Text>

            <Text style={styles.totalDescription}>
              Cobrança recorrente mensal
            </Text>
          </View>

          <View style={styles.totalValueContainer}>
            <Text style={styles.totalValue}>
              {formatarMoeda(
                planoSelecionado.valor
              )}
            </Text>

            <Text style={styles.totalSuffix}>
              /mês
            </Text>
          </View>
        </View>

        {!!confirmError && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle"
              size={17}
              color="#DC2626"
            />

            <Text style={styles.errorText}>
              {confirmError}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!formaPagamento ||
              loadingPayment ||
              confirming) &&
              styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmar}
          disabled={
            !formaPagamento ||
            loadingPayment ||
            confirming
          }
          activeOpacity={0.85}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                {planoAtual
                  ? 'Confirmar alteração'
                  : 'Confirmar assinatura'}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>

        {!formaPagamento && !loadingPayment && (
          <Text style={styles.bottomHint}>
            Cadastre uma forma de pagamento para
            continuar.
          </Text>
        )}

        {isUpgrade && (
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={colors.blue}
            />

            <Text style={styles.infoText}>
              O novo valor da assinatura será aplicado
              conforme as regras do próximo ciclo.
            </Text>
          </View>
        )}

        {isDowngrade && (
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={colors.blue}
            />

            <Text style={styles.infoText}>
              A alteração para o novo plano será
              considerada conforme as regras do próximo
              ciclo.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

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

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  body: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  intro: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 22,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },

  planSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },

  planSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  planSummaryContent: {
    flex: 1,
  },

  planSummaryName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },

  planSummaryCheckins: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue,
    marginBottom: 3,
  },

  planSummaryDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 8,
  },

  summaryLabel: {
    fontSize: 12.5,
    color: colors.textMuted,
    flex: 1,
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    flexShrink: 1,
  },

  summaryValueHighlight: {
    fontSize: 14,
    color: colors.blue,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 3,
  },

  paymentLoading: {
    minHeight: 110,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  paymentLoadingText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },

  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  paymentCardTitleContainer: {
    flex: 1,
  },

  paymentCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },

  paymentCardSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },

  changePaymentText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.blue,
  },

  cardPreview: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 15,
  },

  cardBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  cardBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
  },

  cardNumber: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.text,
    marginBottom: 7,
  },

  cardType: {
    fontSize: 11.5,
    color: colors.textMuted,
  },

  paymentEmptyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  paymentEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  paymentEmptyContent: {
    flex: 1,
  },

  paymentEmptyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 5,
  },

  paymentEmptyText: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
  },

  paymentEmptyHint: {
    fontSize: 11.5,
    color: colors.textLight,
    lineHeight: 17,
    marginTop: 4,
  },

  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 12,
  },

  addPaymentButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.blue,
  },

  paymentErrorCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    padding: 14,
    gap: 9,
  },

  paymentErrorContent: {
    flex: 1,
  },

  paymentErrorText: {
    color: '#DC2626',
    fontSize: 12.5,
    lineHeight: 18,
  },

  paymentRetryText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 7,
  },

  totalCard: {
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  totalLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  totalDescription: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 3,
  },

  totalValueContainer: {
    alignItems: 'flex-end',
  },

  totalValue: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
  },

  totalSuffix: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: -2,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 11,
    marginBottom: 12,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },

  confirmButton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  confirmButtonDisabled: {
    opacity: 0.5,
  },

  confirmButtonText: {
    color: '#fff',
    fontSize: 14.5,
    fontWeight: '800',
  },

  bottomHint: {
    textAlign: 'center',
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 9,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 3,
  },

  infoText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textMuted,
  },

  invalidState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 10,
  },

  invalidStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.md,
    marginTop: 5,
  },

  stateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  /*
   * SUCESSO
   */

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 35,
  },

  successIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },

  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },

  successDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 330,
    marginBottom: 28,
  },

  successPlanCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 16,
    ...shadow,
  },

  successPlanIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  successPlanContent: {
    flex: 1,
  },

  successPlanLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
  },

  successPlanName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },

  successPlanCheckins: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue,
    marginBottom: 4,
  },

  successPlanPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  successPlanSuffix: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },

  successInfoBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 22,
    gap: 8,
  },

  successInfoText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#166534',
  },

  successButton: {
    width: '100%',
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  successButtonText: {
    color: '#fff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});