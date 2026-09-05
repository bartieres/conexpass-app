import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../../theme/theme';

function HistoryItem({ item }) {
  return (
    <View style={styles.item}>
      <View style={styles.statusIcon}>
        <Ionicons
          name={item.status === 'success' ? 'checkmark-circle' : 'close-circle'}
          size={22}
          color={item.status === 'success' ? colors.success : '#DC2626'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDate}>{item.date}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.textLight} />
          <Text style={styles.itemLocation}>{item.location}</Text>
        </View>
      </View>
      {/*
        TODO: reativar navegação para uma tela de detalhe do check-in quando
        o backend passar a retornar mais informações (ex: foto do
        estabelecimento, horário exato da aprovação, quem aprovou na
        recepção). Hoje o card já mostra tudo que existe, então um
        "chevron" prometendo mais detalhe seria enganoso.
      */}
    </View>
  );
}

export default function History({
  historico,
  loading,
  loadingMore,
  refreshing,
  error,
  hasMore,
  onRefresh,
  onLoadMore,
  onRetry,
  periodos,
  periodoId,
  onSelectPeriodo,
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico</Text>
        <Text style={styles.headerSubtitle}>Seus check-ins em estabelecimentos parceiros</Text>
      </View>

      {/*
        A aba "Visitas" foi removida da UI por enquanto (só existe "Check-ins"
        no momento), então trocamos as abas por um filtro de período, que é
        útil de verdade hoje. Quando "Visitas" voltar, dá pra reintroduzir as
        abas acima deste filtro.
      */}
      <View style={styles.periodoRow}>
        {periodos.map((periodo) => {
          const active = periodo.id === periodoId;
          return (
            <TouchableOpacity
              key={periodo.id}
              style={[styles.periodoChip, active && styles.periodoChipActive]}
              onPress={() => onSelectPeriodo(periodo.id)}
            >
              <Text style={[styles.periodoChipText, active && styles.periodoChipTextActive]}>
                {periodo.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color={colors.blue} />
          <Text style={styles.stateText}>Carregando seu histórico...</Text>
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

      {!loading && !error && (
        <FlatList
          data={historico}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 12, gap: 10, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.blue]} tintColor={colors.blue} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>Nenhuma visita registrada nesse período</Text>
            </View>
          }
          renderItem={({ item }) => <HistoryItem item={item} />}
          // Infinite scroll: busca a próxima página perto do fim da lista
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreBox}>
                <ActivityIndicator size="small" color={colors.blue} />
                <Text style={styles.loadingMoreText}>Carregando mais...</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  headerTitle: { ...typography.h1 },
  headerSubtitle: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  periodoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  periodoChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodoChipActive: { backgroundColor: colors.blue },
  periodoChipText: { fontSize: 12.5, fontWeight: '600', color: colors.blue },
  periodoChipTextActive: { color: '#fff' },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    ...shadow,
  },
  statusIcon: { width: 24 },
  itemName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  itemDate: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  itemLocation: { fontSize: 11.5, color: colors.textLight },
  loadingMoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: { fontSize: 12.5, color: colors.textMuted },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: colors.textLight, fontSize: 13 },
});
