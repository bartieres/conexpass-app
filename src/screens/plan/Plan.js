import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../../theme/theme';
import {
  permiteAcao,
  podeAlterarAtual,
  podeAgendarProximo,
  formatarDataPlano,
  formatarValorPlano,
} from '../../utils/assinaturasPlano';

function ActionButton({
  title,
  icon,
  onPress,
  disabled,
  danger,
  primary,
  busy,
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(busy) }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        danger && styles.dangerButton,
        primary && styles.primaryButton,
        disabled && styles.disabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={danger ? '#B91C1C' : colors.blue} />
      ) : (
        <Ionicons
          name={icon}
          size={20}
          color={primary ? '#fff' : danger ? '#B91C1C' : colors.blue}
        />
      )}
      <Text
        style={[
          styles.buttonText,
          danger && styles.dangerText,
          primary && styles.primaryText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, children }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={19} color={colors.blue} />
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

function PlanHeader({ assinatura, badge, pending }) {
  return (
    <View style={styles.planHeader}>
      <View style={styles.brandIcon}>
        <Ionicons name="fitness-outline" size={27} color={colors.blue} />
      </View>
      <View style={styles.planCopy}>
        <Text style={styles.planName}>ConexPass {assinatura.plano.nome}</Text>
        <Text style={styles.planPrice}>
          {formatarValorPlano(assinatura.valor)}
          <Text style={styles.planSuffix}> /mês</Text>
        </Text>
        <View
          style={[
            styles.badge,
            pending
              ? styles.pendingBadge
              : assinatura.podeUtilizar
                ? styles.activeBadge
                : styles.scheduledBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              pending
                ? styles.pendingText
                : assinatura.podeUtilizar
                  ? styles.activeText
                  : styles.scheduledText,
            ]}
          >
            {badge}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function Plan({
  planoAtual,
  proximoPlano,
  pagamentosPendentes,
  semAssinatura,
  loading,
  operacao,
  error,
  onRetry,
  onAlterarPlano,
  onEscolherPlano,
  onAgendarProximo,
  onCancelarRenovacao,
  onAlterarProximo,
  onCancelarProximo,
}) {
  const ocupado = Boolean(operacao) || Boolean(error);
  const renovacaoCancelada = planoAtual?.renovacaoAutomatica === false;
  const permiteAlterar = podeAlterarAtual(
    planoAtual,
    proximoPlano,
    pagamentosPendentes
  );
  const permiteAgendar = podeAgendarProximo(
    planoAtual,
    proximoPlano,
    pagamentosPendentes
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.stateText}>Carregando seus planos...</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color="#B91C1C" />
            <Text style={styles.stateText}>{error}</Text>
            <ActionButton
              title="Tentar novamente"
              icon="refresh-outline"
              disabled={Boolean(operacao)}
              onPress={onRetry}
            />
          </View>
        )}
        {!loading && (
          <>
            {semAssinatura && !error && (
              <View style={[styles.card, styles.emptyCard]}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={40}
                    color={colors.blue}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  Você não possui um plano ConexPass ativo
                </Text>
                <Text style={styles.emptySubtitle}>
                  Escolha um plano para começar a utilizar os estabelecimentos
                  participantes.
                </Text>
                <ActionButton
                  title="Conhecer planos"
                  icon="arrow-forward"
                  primary
                  onPress={onEscolherPlano}
                  disabled={ocupado}
                />
              </View>
            )}
            {planoAtual && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Seu plano atual</Text>
                <PlanHeader
                  assinatura={planoAtual}
                  badge={
                    planoAtual.podeUtilizar
                      ? 'Em uso'
                      : planoAtual.situacao.descricao ||
                        planoAtual.situacao.codigo
                  }
                />
                <View style={styles.divider} />
                <InfoRow icon="calendar-outline">
                  Contratação: {formatarDataPlano(planoAtual.dataContratacao)}
                </InfoRow>
                {!!planoAtual.dataInicioVigencia && (
                  <InfoRow icon="time-outline">
                    Início da vigência:{' '}
                    {formatarDataPlano(planoAtual.dataInicioVigencia, true)}
                  </InfoRow>
                )}
                {!!planoAtual.fimVigencia && (
                  <InfoRow icon="calendar-outline">
                    Vigente até{' '}
                    {formatarDataPlano(planoAtual.fimVigencia, true)}
                  </InfoRow>
                )}
                {!renovacaoCancelada && !!planoAtual.dataProximaCobranca && (
                  <InfoRow icon="card-outline">
                    Próxima cobrança:{' '}
                    {formatarDataPlano(planoAtual.dataProximaCobranca)}
                  </InfoRow>
                )}
                {renovacaoCancelada && (
                  <View style={styles.warningBox}>
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color="#92400E"
                    />
                    <View style={styles.planCopy}>
                      <Text style={styles.warningTitle}>
                        Renovação cancelada
                      </Text>
                      <Text style={styles.warningText}>
                        Não haverá cobrança automática deste plano.
                        {planoAtual.podeUtilizar && planoAtual.fimVigencia
                          ? ` Seu plano continua disponível até ${formatarDataPlano(planoAtual.fimVigencia, true)}.`
                          : ''}
                      </Text>
                    </View>
                  </View>
                )}
                {!!planoAtual.plano.beneficios?.length && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.benefitsTitle}>
                      Benefícios do plano
                    </Text>
                    {planoAtual.plano.beneficios.map((beneficio, index) => (
                      <View
                        key={`${index}-${beneficio}`}
                        style={styles.infoRow}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.success}
                        />
                        <Text style={styles.infoText}>{beneficio}</Text>
                      </View>
                    ))}
                  </>
                )}
                {!renovacaoCancelada && (
                  <ActionButton
                    title="Alterar plano"
                    icon="create-outline"
                    onPress={onAlterarPlano}
                    disabled={ocupado || !permiteAlterar}
                  />
                )}
                {permiteAcao(planoAtual, 'CANCELAR_RENOVACAO') && (
                  <ActionButton
                    title="Cancelar renovação"
                    icon="close-outline"
                    danger
                    onPress={onCancelarRenovacao}
                    disabled={ocupado || pagamentosPendentes.length > 0}
                    busy={operacao === 'CANCELAR_RENOVACAO'}
                  />
                )}
                {permiteAgendar && (
                  <ActionButton
                    title="Escolher próximo plano"
                    icon="calendar-outline"
                    primary
                    onPress={onAgendarProximo}
                    disabled={ocupado}
                  />
                )}
              </View>
            )}
            {proximoPlano && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Próximo plano</Text>
                <PlanHeader assinatura={proximoPlano} badge="Agendado" />
                <View style={styles.divider} />
                <InfoRow icon="calendar-outline">
                  Início da vigência:{' '}
                  {formatarDataPlano(proximoPlano.dataInicioVigencia, true)}
                </InfoRow>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleText}>
                    Cobrança programada para{' '}
                    {formatarDataPlano(
                      proximoPlano.dataProximaCobranca ||
                        proximoPlano.dataInicioVigencia
                    )}
                    . O acesso será liberado após a confirmação do pagamento.
                  </Text>
                </View>
                {permiteAcao(proximoPlano, 'ALTERAR_PROXIMO') && (
                  <ActionButton
                    title="Alterar próximo plano"
                    icon="create-outline"
                    onPress={onAlterarProximo}
                    disabled={ocupado}
                  />
                )}
                {permiteAcao(proximoPlano, 'CANCELAR_PROXIMO') && (
                  <ActionButton
                    title="Cancelar próximo plano"
                    icon="close-outline"
                    danger
                    onPress={onCancelarProximo}
                    disabled={ocupado}
                    busy={operacao === 'CANCELAR_PROXIMO'}
                  />
                )}
              </View>
            )}
            {pagamentosPendentes.map((assinatura) => (
              <View style={styles.card} key={assinatura.id}>
                <Text style={styles.sectionTitle}>Situação da contratação</Text>
                <PlanHeader
                  assinatura={assinatura}
                  badge={
                    [
                      'AGUARDANDO_CONFIRMACAO',
                      'PROCESSING_PAYMENT',
                      'PENDING_PAYMENT',
                      'PROCESSANDO',
                      'PENDENTE',
                    ].includes(assinatura.situacao.codigo)
                      ? 'Aguardando pagamento'
                      : assinatura.situacao.descricao ||
                        assinatura.situacao.codigo
                  }
                  pending
                />
                <View style={styles.warningBox}>
                  <Ionicons name="time-outline" size={23} color="#92400E" />
                  <Text style={[styles.infoText, styles.warningText]}>
                    Acesso liberado após confirmação do pagamento. Confira a
                    situação antes de uma nova contratação.
                  </Text>
                </View>
                <ActionButton
                  title="Atualizar situação"
                  icon="refresh-outline"
                  onPress={onRetry}
                  disabled={Boolean(operacao)}
                  busy={operacao === 'ATUALIZAR'}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: { ...typography.h1 },
  body: { padding: 20, gap: 20, paddingBottom: 32 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  planHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  brandIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E7EFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCopy: { flex: 1 },
  planName: { fontSize: 20, fontWeight: '800', color: colors.text },
  planPrice: {
    fontSize: 20,
    color: '#52617A',
    fontWeight: '600',
    marginTop: 6,
  },
  planSuffix: { fontSize: 14 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  activeBadge: { backgroundColor: '#DFF4DE' },
  activeText: { color: '#206A28' },
  scheduledBadge: { backgroundColor: '#E1ECFF' },
  scheduledText: { color: colors.blueDark },
  pendingBadge: { backgroundColor: '#FFF1CE' },
  pendingText: { color: '#92400E' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.text },
  benefitsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFF4D2',
    marginTop: 10,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: { color: '#825518', fontSize: 13, lineHeight: 20 },
  scheduleInfo: {
    backgroundColor: '#EDF3FF',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
  },
  scheduleText: { color: colors.blueDark, fontSize: 13, lineHeight: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 16,
    padding: 14,
    minHeight: 50,
    marginTop: 14,
  },
  buttonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  dangerButton: { borderColor: '#EF6464', backgroundColor: '#FFF4F4' },
  dangerText: { color: '#B91C1C' },
  primaryButton: { backgroundColor: colors.blue },
  primaryText: { color: '#fff' },
  disabled: { opacity: 0.45 },
  emptyCard: { paddingVertical: 32 },
  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 26,
    alignSelf: 'center',
    backgroundColor: '#E7EFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  stateBox: { alignItems: 'center', gap: 12, padding: 28 },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  operationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
});
