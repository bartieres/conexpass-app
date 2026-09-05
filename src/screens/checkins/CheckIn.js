import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../../theme/theme';

// Visual de cada tipo de check-in: cor e ícone usados no bloco de resumo,
// na "pill" do histórico e no círculo de cada linha.
const TYPE_META = {
  Plano: { color: colors.blue, bg: '#E8EEFC', icon: 'calendar-outline' },
  Avulso: { color: '#B45309', bg: '#FEF3C7', icon: 'cart-outline' },
  Bônus: { color: colors.success, bg: colors.successLight, icon: 'gift-outline' },
};

function StatBox({ label, value, meta }) {
  return (
    <View style={[styles.statBox, { backgroundColor: meta.bg }]}>
      <View style={[styles.statIconWrap, { backgroundColor: '#fff' }]}>
        <Ionicons name={meta.icon} size={16} color={meta.color} />
      </View>
      <Text style={[styles.statValue, { color: meta.color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ResumoCard({ resumo, loading, error, onRetry }) {
  if (loading) {
    return (
      <View style={[styles.resumoCard, styles.resumoStateBox]}>
        <ActivityIndicator size="small" color={colors.blue} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.resumoCard, styles.resumoStateBox]}>
        <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
        <Text style={styles.resumoErrorText}>{error}</Text>
        <TouchableOpacity onPress={onRetry}>
          <Text style={styles.resumoRetryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!resumo) return null;

  return (
    <View style={styles.resumoCard}>
      <Text style={styles.resumoTitle}>Seus check-ins disponíveis</Text>

      <View style={styles.statsRow}>
        <StatBox label="Plano" value={resumo.plano} meta={TYPE_META.Plano} />
        <StatBox label="Avulsos" value={resumo.avulso} meta={TYPE_META.Avulso} />
        <StatBox label="Bônus" value={resumo.bonus} meta={TYPE_META.Bônus} />
      </View>

      <View style={styles.totalPill}>
        <Text style={styles.totalPillLabel}>Total disponível</Text>
        <View style={styles.totalPillBadge}>
          <Text style={styles.totalPillBadgeText}>{resumo.disponiveis} check-ins</Text>
        </View>
      </View>
    </View>
  );
}

function PeriodoDropdown({ periodos, periodoId, onSelect }) {
  const [visible, setVisible] = useState(false);
  const atual = periodos.find((p) => p.id === periodoId) ?? periodos[0];

  return (
    <>
      <TouchableOpacity style={styles.periodoButton} onPress={() => setVisible(true)}>
        <Ionicons name="calendar-outline" size={14} color={colors.blue} />
        <Text style={styles.periodoButtonText}>{atual.label}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.blue} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.dropdownMenu}>
            {periodos.map((periodo) => {
              const active = periodo.id === periodoId;
              return (
                <TouchableOpacity
                  key={periodo.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(periodo.id);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                    {periodo.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={colors.blue} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function CheckInRow({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.Plano;
  return (
    <View style={styles.row}>
      <View style={[styles.rowIconWrap, { backgroundColor: meta.bg }]}>
        <Ionicons name="barbell-outline" size={18} color={meta.color} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rowTopLine}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.establishmentName}
          </Text>
          <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.typePillText, { color: meta.color }]}>{item.type}</Text>
          </View>
        </View>

        <Text style={styles.rowDate}>{item.formattedTime}</Text>

        <View style={styles.rowStatusRow}>
          <Ionicons
            name={item.status === 'success' ? 'checkmark-circle' : 'close-circle'}
            size={13}
            color={item.status === 'success' ? colors.success : '#DC2626'}
          />
          <Text style={[styles.rowStatusText, item.status !== 'success' && styles.rowStatusTextError]}>
            {item.status === 'success' ? 'Check-in realizado' : 'Check-in não confirmado'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Card promocional de indicação — visível desde já, mas sem ação de verdade
// por enquanto (funcionalidade prevista para depois do MVP).
function ReferralBanner() {
  return (
    <TouchableOpacity style={styles.referralCard} activeOpacity={0.85} disabled>
      <View style={styles.referralIconWrap}>
        <Ionicons name="gift" size={20} color={colors.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.referralTitle}>Indique um amigo e ganhe</Text>
        <Text style={styles.referralSubtitle}>Convide amigos para o ConexPass e ganhe 1 check-in!</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

export default function CheckIn({
  resumo,
  loadingResumo,
  resumoError,
  historico,
  loading,
  loadingMore,
  refreshing,
  historicoError,
  hasMore,
  onRefresh,
  onLoadMore,
  onRetryResumo,
  onRetryHistorico,
  periodos,
  periodoId,
  onSelectPeriodo,
}) {
  // Agrupa o histórico (lista plana e paginada) por rótulo de data. Feito a
  // partir do estado acumulado inteiro, não por página — assim um mesmo dia
  // não vira duas seções quando cruza um limite de página.
  const sections = useMemo(() => {
    const grupos = new Map();
    historico.forEach((item) => {
      if (!grupos.has(item.dateLabel)) grupos.set(item.dateLabel, []);
      grupos.get(item.dateLabel).push(item);
    });
    return Array.from(grupos.entries()).map(([title, data]) => ({ title, data }));
  }, [historico]);

  const listaCarregada = !loading && !historicoError;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-ins</Text>
        {/* <Text style={styles.headerSubtitle}>Seus acessos aos estabelecimentos parceiros</Text> */}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, flexGrow: 1 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <ResumoCard resumo={resumo} loading={loadingResumo} error={resumoError} onRetry={onRetryResumo} />

            <View style={styles.historicoHeaderRow}>
              <Text style={styles.historicoTitle}>Histórico</Text>
              <PeriodoDropdown periodos={periodos} periodoId={periodoId} onSelect={onSelectPeriodo} />
            </View>

            {loading && (
              <View style={styles.stateBox}>
                <ActivityIndicator size="small" color={colors.blue} />
                <Text style={styles.stateText}>Carregando seu histórico...</Text>
              </View>
            )}

            {!loading && !!historicoError && (
              <View style={styles.stateBox}>
                <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
                <Text style={styles.stateText}>{historicoError}</Text>
                <TouchableOpacity style={styles.stateButton} onPress={onRetryHistorico}>
                  <Text style={styles.stateButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderSectionHeader={({ section }) =>
          listaCarregada ? <Text style={styles.sectionHeader}>{section.title}</Text> : null
        }
        renderItem={({ item }) => (listaCarregada ? <CheckInRow item={item} /> : null)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          listaCarregada ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={36} color={colors.textLight} />
              <Text style={styles.emptyText}>Nenhum check-in registrado nesse período</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.blue]} tintColor={colors.blue} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          <>
            {loadingMore && (
              <View style={styles.loadingMoreBox}>
                <ActivityIndicator size="small" color={colors.blue} />
                <Text style={styles.loadingMoreText}>Carregando mais...</Text>
              </View>
            )}

            {/* Visível desde já, mesmo sendo funcionalidade pós-MVP */}
            {listaCarregada && !loadingMore && <ReferralBanner />}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  headerTitle: { ...typography.h1 },
  headerSubtitle: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },

  resumoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 20,
    ...shadow,
  },
  resumoStateBox: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  resumoErrorText: { color: colors.textMuted, fontSize: 12.5, textAlign: 'center' },
  resumoRetryText: { color: colors.blue, fontWeight: '700', fontSize: 12.5, textDecorationLine: 'underline' },
  resumoTitle: { ...typography.h3, marginBottom: 14 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, borderRadius: radius.md, padding: 12, alignItems: 'center', gap: 4 },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11.5, color: colors.textMuted, fontWeight: '600' },

  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalPillLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  totalPillBadge: { backgroundColor: colors.blue, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  totalPillBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12.5 },

  historicoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historicoTitle: { ...typography.h3 },
  periodoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  periodoButtonText: { fontSize: 12.5, fontWeight: '700', color: colors.blue },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  dropdownMenu: {
    position: 'absolute',
    top: 150,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingVertical: 6,
    minWidth: 170,
    ...shadow,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemText: { fontSize: 13.5, color: colors.text },
  dropdownItemTextActive: { color: colors.blue, fontWeight: '700' },

  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 30 },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    ...shadow,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  typePillText: { fontSize: 11, fontWeight: '700' },
  rowDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowStatusText: { fontSize: 11.5, color: colors.success, fontWeight: '600' },
  rowStatusTextError: { color: '#DC2626' },
  separator: { height: 10 },

  loadingMoreBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  loadingMoreText: { fontSize: 12.5, color: colors.textMuted },

  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF1FC',
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 16,
  },
  referralIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralTitle: { fontSize: 14, fontWeight: '800', color: colors.blue },
  referralSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },

  emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText: { color: colors.textLight, fontSize: 13 },
});
