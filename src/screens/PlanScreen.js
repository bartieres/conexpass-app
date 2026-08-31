import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, typography, gradients } from '../theme/theme';

const USED = 3;
const TOTAL = 5;

export default function PlanScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Plano</Text>
      </View>

      <View style={styles.body}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.planCard}>
          <View style={styles.planTopRow}>
            <View style={styles.crownWrap}>
              <Ionicons name="star" size={16} color="#fff" />
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Ativo</Text>
            </View>
          </View>
          <Text style={styles.planName}>Plano Premium</Text>
          <Text style={styles.planRenewal}>Renovação em 20/06/2025</Text>

          <View style={styles.planFeatures}>
            {['5 check-ins por dia', 'Acesso a todas academias', 'Benefícios exclusivos', 'Suporte prioritário'].map(
              (f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              )
            )}
          </View>

          <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('Plans')}>
            <Text style={styles.manageButtonText}>Gerenciar plano</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>Uso do plano hoje</Text>
          <Text style={styles.usageCount}>
            {USED}/{TOTAL} check-ins realizados
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(USED / TOTAL) * 100}%` }]} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { ...typography.h1 },
  body: { padding: 20, gap: 16 },
  planCard: { borderRadius: radius.xl, padding: 22, ...shadow },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  crownWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 14 },
  planRenewal: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, marginTop: 2, marginBottom: 16 },
  planFeatures: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: '#fff', fontSize: 13.5 },
  manageButton: { backgroundColor: '#fff', height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  manageButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },
  usageCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, ...shadow },
  usageTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  usageCount: { fontSize: 12.5, color: colors.textMuted, marginTop: 4, marginBottom: 10 },
  progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.blue, borderRadius: 4 },
});
