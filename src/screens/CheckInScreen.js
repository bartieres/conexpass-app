import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius, typography } from '../theme/theme';
import { GYMS } from '../data/mock';

export default function CheckInScreen({ route, navigation }) {
  const gym = route.params?.gym || GYMS[0];

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Check-in</Text>
        <Text style={styles.subtitle}>Mostre este QR Code na recepção do estabelecimento</Text>

        <TouchableOpacity
          style={styles.qrCard}
          activeOpacity={0.9}
          onPress={() => navigation.replace('CheckInSuccess', { gym })}
        >
          <QRCode value={`conexpass-checkin:${gym.id}:${Date.now()}`} size={190} color={colors.navy} backgroundColor="#fff" />
        </TouchableOpacity>

        <Text style={styles.gymName}>{gym.name}</Text>
        <Text style={styles.gymLocation}>Londrina - PR</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.remainingPill}>
          <Text style={styles.remainingText}>Check-ins restantes hoje</Text>
          <View style={styles.remainingBadge}>
            <Text style={styles.remainingBadgeText}>3 / 5</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.blue },
  backButton: { marginLeft: 20, marginTop: 10, width: 38, height: 38, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 13.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 30, lineHeight: 19 },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 24,
    marginBottom: 26,
  },
  gymName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  gymLocation: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  footer: { padding: 24 },
  remainingPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  remainingBadge: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  remainingBadgeText: { color: colors.blue, fontWeight: '800', fontSize: 12.5 },
});
