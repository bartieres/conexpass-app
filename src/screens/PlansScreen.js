import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { PLANS } from '../data/mock';

export default function PlansScreen({ navigation }) {
  const [period, setPeriod] = useState('mensal');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planos</Text>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, period === 'mensal' && styles.toggleBtnActive]}
          onPress={() => setPeriod('mensal')}
        >
          <Text style={[styles.toggleText, period === 'mensal' && styles.toggleTextActive]}>Mensal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, period === 'anual' && styles.toggleBtnActive]}
          onPress={() => setPeriod('anual')}
        >
          <Text style={[styles.toggleText, period === 'anual' && styles.toggleTextActive]}>Anual (10% OFF)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {PLANS.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Mais popular</Text>
              </View>
            )}
            <Text style={[styles.planName, plan.popular && styles.planNameLight]}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, plan.popular && styles.planNameLight]}>{plan.price}</Text>
              <Text style={[styles.period, plan.popular && styles.periodLight]}>{plan.period}</Text>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={plan.popular ? '#fff' : colors.blue} />
                  <Text style={[styles.featureText, plan.popular && styles.featureTextLight]}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.selectButton, plan.popular && styles.selectButtonLight]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.selectButtonText, plan.popular && styles.selectButtonTextDark]}>Escolher plano</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { ...typography.h1 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEEF7',
    borderRadius: radius.pill,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.pill },
  toggleBtnActive: { backgroundColor: colors.blue },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: '#fff' },
  list: { padding: 20, gap: 16 },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  planCardPopular: { backgroundColor: colors.blue, borderColor: colors.blue },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  popularBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planName: { fontSize: 18, fontWeight: '800', color: colors.text },
  planNameLight: { color: '#fff' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 8, marginBottom: 18 },
  price: { fontSize: 28, fontWeight: '800', color: colors.text },
  period: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  periodLight: { color: 'rgba(255,255,255,0.8)' },
  featuresList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13.5, color: colors.text },
  featureTextLight: { color: '#fff' },
  selectButton: { backgroundColor: colors.blue, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  selectButtonLight: { backgroundColor: '#fff' },
  selectButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  selectButtonTextDark: { color: colors.blue },
});
