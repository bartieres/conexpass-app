import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors, radius, shadow, typography } from '../../theme/theme';
import { CATEGORIES } from '../../data/mock';

// Chaves enviadas ao backend para cada opção de ordenação exibida na tela.
// 'preco' fica pronto mas o back ainda pode não suportar - ver comentário abaixo.
const SORT_OPTIONS = [
  { label: 'Mais próximos', value: 'distancia' },
  { label: 'Melhor avaliados', value: 'avaliacao' },
  { label: 'Menor preço', value: 'preco' }, // TODO: confirmar suporte no backend
];

const RAIO_MIN_KM = 1;
const RAIO_MAX_KM = 20;

/**
 * FiltersScreen
 *
 * Não tem estado de negócio próprio: recebe os filtros atuais via
 * route.params.initialFiltros e, ao aplicar, NAVEGA DE VOLTA pra tela
 * "Explorar" levando os novos filtros como parâmetro (apenas dados, nunca
 * uma função — funções em route.params não são serializáveis e quebram o
 * React Navigation, gerando o aviso "Non-serializable values were found in
 * the navigation state").
 *
 * route.params esperado:
 * {
 *   initialFiltros: { categorias: string[], raioKm: number, estrelasMin: number, ordenarPor: string },
 * }
 */
export default function FiltersScreen({ navigation, route }) {
  const initialFiltros = route?.params?.initialFiltros ?? {};

  const [selected, setSelected] = useState(initialFiltros.categorias ?? []);
  const [distance, setDistance] = useState(initialFiltros.raioKm ?? 5);
  const [minRating, setMinRating] = useState(initialFiltros.estrelasMin ?? 0);
  const [sort, setSort] = useState(initialFiltros.ordenarPor ?? SORT_OPTIONS[0].value);

  const toggleCategory = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleClear = () => {
    setSelected([]);
    setDistance(5);
    setMinRating(0);
    setSort(SORT_OPTIONS[0].value);
  };

  const handleApply = () => {
    const filtros = {
      categorias: selected,
      raioKm: distance,
      estrelasMin: minRating,
      ordenarPor: sort,
    };

    // Navega de volta pra tela "Explorar" já existente na stack, levando os
    // filtros como parâmetro simples — nunca uma função.
    navigation.navigate('ExploreMain', { filtrosAplicados: filtros });
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
        <TouchableOpacity onPress={handleClear}>
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
          minimumValue={RAIO_MIN_KM}
          maximumValue={RAIO_MAX_KM}
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
            <TouchableOpacity
              key={n}
              onPress={() => setMinRating((atual) => (atual === n ? 0 : n))}
            >
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
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={styles.sortRow} onPress={() => setSort(opt.value)}>
              <Text style={styles.sortLabel}>{opt.label}</Text>
              <View style={[styles.radio, sort === opt.value && styles.radioActive]}>
                {sort === opt.value && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.85}>
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
