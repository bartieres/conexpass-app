import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { checkinService } from '../services/checkinService';
import { dateTimeToDateMasked } from '../utils/date';

export default function HistoryScreen() {
  const [tab, setTab] = useState('checkins');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await checkinService.findAllByCondition({
          ignoreSize: true,
        });

        const formatted = response.content.map((u) => ({
          id: u.id,
          name: u.nome,
          date: dateTimeToDateMasked(u.data),
          status: u.situacao.codigo === 'CONFIRMADO' ? 'success' : 'error',
          location: u.endereco.cidade.nome + ' - ' + u.endereco.cidade.estado.uf,
        }));

        setHistory(formatted);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    };

    loadHistory();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setTab('checkins')}>
          <Text style={[styles.tabText, tab === 'checkins' && styles.tabTextActive]}>Check-ins</Text>
          {tab === 'checkins' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        {/*<TouchableOpacity style={styles.tabButton} onPress={() => setTab('visitas')}>
          <Text style={[styles.tabText, tab === 'visitas' && styles.tabTextActive]}>Visitas</Text>
          {tab === 'visitas' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>*/}
      </View>

      <FlatList
        data={tab === 'checkins' ? history : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>Nenhuma visita registrada ainda</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.statusIcon}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDate}>{item.date}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={colors.textLight} />
                <Text style={styles.itemLocation}>{item.location}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { ...typography.h1 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabButton: { marginRight: 28, paddingBottom: 12, alignItems: 'center' },
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.blue },
  tabIndicator: { height: 3, width: '100%', backgroundColor: colors.blue, borderRadius: 3, marginTop: 8 },
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
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: colors.textLight, fontSize: 13 },
});
