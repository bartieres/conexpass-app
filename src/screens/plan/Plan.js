import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../../theme/theme';

function formatarMoeda(valor) {
  if (valor == null) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
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

export default function Plan({
  navigation,
  plano,
  loading,
  error,
  onRetry,
  onVerDetalhes,
  onAlterarPlano,
  onPagamentos,
  onFormaPagamento,
  onHistorico,
  onCancelarPlano,
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planos</Text>
        <View style={{ width: 38 }} />
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

        {!loading && !error && plano && (
          <>
            <View style={styles.planCard}>
              <View style={styles.planTopRow}>
                <View style={styles.planPill}>
                  <Text style={styles.planPillText}>Seu plano</Text>
                </View>
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
                <Text style={styles.planInfoText}>Contratação: {formatarData(plano.dataContratacao)}</Text>
              </View>
              <View style={styles.planInfoRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.blue} />
                <Text style={styles.planInfoText}>
                  Próxima cobrança: {formatarData(plano.proximaCobranca?.data)} — {formatarMoeda(plano.proximaCobranca?.valor)}
                </Text>
              </View>

              <View style={styles.planDivider} />

              {(plano.beneficios || []).map((beneficio) => (
                <View key={beneficio} style={styles.planInfoRow}>
                  <Ionicons name="checkmark-circle-outline" size={15} color={colors.blue} />
                  <Text style={styles.planInfoText}>{beneficio}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.detailsButton} onPress={onVerDetalhes}>
                <Text style={styles.detailsButtonText}>Ver detalhes</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.blue} />
              </TouchableOpacity>
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
                icon="card-outline"
                title="Forma de pagamento"
                subtitle="Cartão cadastrado e alteração"
                onPress={onFormaPagamento}
              />
            </View>

            <View style={styles.menuCard}>
              <MenuRow
                icon="document-text-outline"
                title="Histórico do plano"
                subtitle="Alterações de plano e condições contratadas"
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

  planCard: {
    backgroundColor: '#EEF1FC',
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 4,
  },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  planPillText: { fontSize: 11.5, fontWeight: '700', color: colors.blue },
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
  planName: { fontSize: 21, fontWeight: '800', color: colors.text, marginTop: 14 },
  planPrice: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4, marginBottom: 14 },
  planPriceSuffix: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  planInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  planInfoText: { fontSize: 13, color: colors.text },
  planDivider: { height: 1, backgroundColor: 'rgba(43,108,224,0.15)', marginVertical: 10 },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(43,108,224,0.12)',
    height: 46,
    borderRadius: radius.md,
    marginTop: 6,
  },
  detailsButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },

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
