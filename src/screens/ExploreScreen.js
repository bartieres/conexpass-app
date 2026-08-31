import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { CATEGORIES, GYMS } from '../data/mock';

function GymCard({ gym, onPress }) {
  return (
    <TouchableOpacity style={styles.gymCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: gym.image }} style={styles.gymImage} />
      <View style={styles.gymInfo}>
        <Text style={styles.gymName}>{gym.name}</Text>
        <Text style={styles.gymMeta}>
          {gym.distance} • {gym.hours}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={styles.ratingText}>
            {gym.rating} ({gym.reviews})
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const [view, setView] = useState('lista');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedGym, setSelectedGym] = useState(GYMS[0]);
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explorar</Text>
          <TouchableOpacity style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.blue} />
            <Text style={styles.locationText}>Londrina - PR</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estabelecimentos..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => navigation.navigate('Filters')}>
          <Ionicons name="options-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'lista' && styles.toggleBtnActive]}
          onPress={() => setView('lista')}
        >
          <Text style={[styles.toggleText, view === 'lista' && styles.toggleTextActive]}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'mapa' && styles.toggleBtnActive]}
          onPress={() => setView('mapa')}
        >
          <Text style={[styles.toggleText, view === 'mapa' && styles.toggleTextActive]}>Mapa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsRow}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          renderItem={({ item }) => {
            const active = activeCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCategory(item.id)}
              >
                <Ionicons name={item.icon} size={15} color={active ? '#fff' : colors.blue} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {view === 'lista' ? (
        <FlatList
          data={GYMS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Próximos de você</Text>}
          renderItem={({ item }) => (
            <GymCard gym={item} onPress={() => navigation.navigate('EstablishmentDetail', { gym: item })} />
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.9}>
              <View style={styles.premiumIcon}>
                <Ionicons name="star" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Seja Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Tenha mais check-ins por dia e desbloqueie benefícios exclusivos.
                </Text>
              </View>
            </TouchableOpacity>
          }
        />
      ) : (
        <View style={styles.mapWrap}>
          <View style={styles.mapArea}>
            {GYMS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.pin, { top: g.coord.top, left: g.coord.left }]}
                onPress={() => setSelectedGym(g)}
              >
                <Ionicons name="location" size={30} color={g.id === selectedGym.id ? colors.blueDark : colors.blue} />
              </TouchableOpacity>
            ))}
            <Text style={styles.mapCityLabel}>Londrina</Text>
          </View>

          <TouchableOpacity
            style={styles.mapCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EstablishmentDetail', { gym: selectedGym })}
          >
            <Image source={{ uri: selectedGym.image }} style={styles.mapCardImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.gymName}>{selectedGym.name}</Text>
              <Text style={styles.gymMeta}>
                {selectedGym.distance} • {selectedGym.hours}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={colors.star} />
                <Text style={styles.ratingText}>
                  {selectedGym.rating} ({selectedGym.reviews})
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTitle: { ...typography.h1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { color: colors.blue, fontWeight: '700', fontSize: 13 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 14 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: colors.text },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEEF7',
    borderRadius: radius.pill,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  toggleBtnActive: { backgroundColor: colors.blue },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: '#fff' },
  chipsRow: { marginTop: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
  },
  chipActive: { backgroundColor: colors.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.blue },
  chipTextActive: { color: '#fff' },
  sectionTitle: { ...typography.h3, marginBottom: 4 },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 10,
    gap: 12,
    ...shadow,
  },
  gymImage: { width: 64, height: 64, borderRadius: radius.md },
  gymInfo: { flex: 1, gap: 2 },
  gymName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  gymMeta: { fontSize: 12, color: colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.blue,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 6,
  },
  premiumIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  premiumSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  mapWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16 },
  mapArea: {
    flex: 1,
    backgroundColor: '#E4EAF6',
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mapCityLabel: {
    position: 'absolute',
    top: '38%',
    left: '32%',
    fontSize: 16,
    fontWeight: '700',
    color: '#B9C6E3',
  },
  pin: { position: 'absolute' },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 10,
    marginTop: 12,
    ...shadow,
  },
  mapCardImage: { width: 56, height: 56, borderRadius: radius.md },
});
