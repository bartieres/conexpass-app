import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../../theme/theme';
import { dateToDateMasked } from '../../utils/date';

function formatarMoeda(valor) {
  if (valor == null) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function MenuRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={19} color={colors.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

// Estado dedicado para quem ainda não tem nenhuma assinatura contratada
// (usuário novo, ou que cancelou e ainda não recontratou). Fica no mesmo
// retângulo branco do resumo, mas convida a escolher um plano em vez de
// mostrar dados que não existem.
function SemAssinaturaCard({ onEscolherPlano }) {
  return (
    <View style={styles.resumoCard}>
      <View style={styles.semAssinaturaIconWrap}>
        <Ionicons name="sparkles-outline" size={26} color={colors.blue} />
      </View>
      <Text style={styles.semAssinaturaTitle}>Você ainda não tem uma assinatura</Text>
      <Text style={styles.semAssinaturaSubtitle}>
        Escolha um plano para começar a fazer check-ins nos estabelecimentos parceiros.
      </Text>
      <TouchableOpacity style={styles.escolherPlanoButton} onPress={onEscolherPlano}>
        <Text style={styles.escolherPlanoButtonText}>Escolher plano</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function Plan({
  navigation,
  plano,
  temAssinatura,
  loading,
  error,
  onRetry,
  onAlterarPlano,
  onEscolherPlano,
  onPagamentos,
  onHistorico,
  onCancelarPlano,
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.stateButton} onPress={onRetry}>
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Usuário sem nenhuma assinatura ainda — tela funcional, com CTA */}
        {!loading && !error && !temAssinatura && <SemAssinaturaCard onEscolherPlano={onEscolherPlano} />}

        {!loading && !error && temAssinatura && plano && (
          <>
            <View style={styles.resumoCard}>
              <View style={styles.resumoTopRow}>
                <Text style={styles.resumoTitle}>Seu plano atual</Text>
                <View style={[styles.activeBadge, !plano.ativo && styles.inactiveBadge]}>
                  <View style={[styles.activeDot, !plano.ativo && styles.inactiveDot]} />
                  <Text style={[styles.activeBadgeText, !plano.ativo && styles.inactiveBadgeText]}>
                    {plano.ativo ? 'Ativo' : 'Inativo'}
                  </Text>
                </View>
              </View>

              <Text style={styles.planName}>{plano.nome}</Text>
              <Text style={styles.planPrice}>
                {formatarMoeda(plano.valor)}
                <Text style={styles.planPriceSuffix}>/mês</Text>
              </Text>

              <View style={styles.planInfoRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.blue} />
                <Text style={styles.planInfoText}>Contratação: {dateToDateMasked(plano.dataContratacao)}</Text>
              </View>
              <View style={styles.planInfoRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.blue} />
                <Text style={styles.planInfoText}>
                  Próxima cobrança: {dateToDateMasked(plano.proximaCobranca?.data)} —{' '}
                  {formatarMoeda(plano.proximaCobranca?.valor)}
                </Text>
              </View>

              <View style={styles.planDivider} />

              {(plano.beneficios || []).map((beneficio) => (
                <View key={beneficio} style={styles.planInfoRow}>
                  <Ionicons name="checkmark-circle-outline" size={15} color={colors.blue} />
                  <Text style={styles.planInfoText}>{beneficio}</Text>
                </View>
              ))}
            </View>

            <View style={styles.menuCard}>
              <MenuRow
                icon="options-outline"
                title="Alterar plano"
                subtitle="Visualize outros planos e faça sua escolha"
                onPress={onAlterarPlano}
              />
            </View>

            <View style={styles.menuCard}>
              <MenuRow
                icon="card-outline"
                title="Pagamentos"
                subtitle="Próxima cobrança e histórico de pagamentos"
                onPress={onPagamentos}
              />
            </View>

            <View style={styles.menuCard}>
              <MenuRow
                icon="document-text-outline"
                title="Histórico do plano"
                subtitle="Condições atuais e alterações anteriores"
                onPress={onHistorico}
              />
            </View>

            <TouchableOpacity style={styles.dangerCard} onPress={onCancelarPlano} activeOpacity={0.8}>
              <View style={styles.dangerLeft}>
                <Ionicons name="warning-outline" size={22} color="#DC2626" />
                <View>
                  <Text style={styles.dangerTitle}>Gerenciar assinatura</Text>
                  <Text style={styles.dangerSubtitle}>Precisa cancelar sua assinatura?</Text>
                </View>
              </View>
              <View style={styles.dangerRight}>
                <Text style={styles.dangerLink}>Cancelar plano</Text>
                <Ionicons name="chevron-forward" size={16} color="#DC2626" />
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  headerTitle: { ...typography.h1 },
  body: { padding: 20, paddingTop: 4, gap: 14 },

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

  // Mesmo padrão de "retângulo branco com sombra" usado no resumo de Check-ins
  resumoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 4,
    ...shadow,
  },
  resumoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resumoTitle: { ...typography.h3 },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  activeBadgeText: { fontSize: 11.5, fontWeight: '700', color: colors.success },
  inactiveBadge: { backgroundColor: '#FEE2E2' },
  inactiveDot: { backgroundColor: '#DC2626' },
  inactiveBadgeText: { color: '#DC2626' },

  planName: { fontSize: 21, fontWeight: '800', color: colors.text },
  planPrice: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4, marginBottom: 14 },
  planPriceSuffix: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  planInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  planInfoText: { fontSize: 13, color: colors.text },
  planDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },

  // Estado "sem assinatura"
  semAssinaturaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  semAssinaturaTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' },
  semAssinaturaSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 18,
  },
  escolherPlanoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.blue,
    height: 50,
    borderRadius: radius.md,
  },
  escolherPlanoButtonText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },

  menuCard: { backgroundColor: '#fff', borderRadius: radius.md, ...shadow },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  menuSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: 14,
    marginTop: 4,
  },
  dangerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dangerTitle: { fontSize: 13.5, fontWeight: '700', color: '#DC2626' },
  dangerSubtitle: { fontSize: 11.5, color: '#991B1B', marginTop: 1 },
  dangerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dangerLink: { fontSize: 12.5, fontWeight: '700', color: '#DC2626' },
});
