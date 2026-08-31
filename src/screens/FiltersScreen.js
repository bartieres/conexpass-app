import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors, radius, shadow, typography } from '../theme/theme';
import { CATEGORIES } from '../data/mock';

export default function FiltersScreen({ navigation }) {
  const [selected, setSelected] = useState(['academia']);
  const [distance, setDistance] = useState(5);
  const [minRating, setMinRating] = useState(0);
  const sortOptions = ['Mais próximos', 'Melhor avaliados', 'Menor preço'];
  const [sort, setSort] = useState(sortOptions[0]);

  const toggleCategory = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Filtros</Text>
        <TouchableOpacity onPress={() => { setSelected([]); setDistance(5); setMinRating(0); }}>
          <Text style={styles.clearText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <View style={styles.chipsWrap}>
          {CATEGORIES.filter((c) => c.id !== 'todos').map((c) => {
            const active = selected.includes(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleCategory(c.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Distância máxima</Text>
          <Text style={styles.valueText}>{distance} km</Text>
        </View>
        <Slider
          style={{ width: '100%', height: 36 }}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={distance}
          onValueChange={setDistance}
          minimumTrackTintColor={colors.blue}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.blue}
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Avaliação mínima</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setMinRating(n)}>
              <Ionicons
                name={n <= minRating ? 'star' : 'star-outline'}
                size={28}
                color={n <= minRating ? colors.star : colors.textLight}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.ouMaisText}>ou mais</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Ordenar por</Text>
        <View style={styles.sortWrap}>
          {sortOptions.map((opt) => (
            <TouchableOpacity key={opt} style={styles.sortRow} onPress={() => setSort(opt)}>
              <Text style={styles.sortLabel}>{opt}</Text>
              <View style={[styles.radio, sort === opt && styles.radioActive]}>
                {sort === opt && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.applyButtonText}>Aplicar filtros</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  clearText: { color: colors.blue, fontWeight: '600', fontSize: 13 },
  body: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.blue },
  chipTextActive: { color: '#fff' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueText: { fontSize: 13, fontWeight: '700', color: colors.blue },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ouMaisText: { marginLeft: 8, fontSize: 12.5, color: colors.textMuted },
  sortWrap: { gap: 4 },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortLabel: { fontSize: 13.5, color: colors.text },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.blue },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  applyButton: { backgroundColor: colors.blue, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  applyButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
