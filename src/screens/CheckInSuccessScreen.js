import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme/theme';
import { GYMS } from '../data/mock';

export default function CheckInSuccessScreen({ route, navigation }) {
  const gym = route.params?.gym || GYMS[0];

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>
        <Text style={styles.title}>Check-in realizado{'\n'}com sucesso!</Text>

        <View style={styles.gymCard}>
          <Image source={{ uri: gym.image }} style={styles.gymImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.gymName}>{gym.name}</Text>
            <Text style={styles.gymMeta}>Hoje, 08:45</Text>
            <Text style={styles.gymMeta}>Londrina - PR</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Historico')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Ver histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Explorar')}>
          <Text style={styles.secondaryLink}>Fazer novo check-in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  backButton: { marginLeft: 20, marginTop: 10, width: 38, height: 38, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  successCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 28, lineHeight: 27 },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 12,
    width: '100%',
    ...shadow,
  },
  gymImage: { width: 50, height: 50, borderRadius: radius.md },
  gymName: { fontSize: 14, fontWeight: '700', color: colors.text },
  gymMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  footer: { padding: 24, gap: 14 },
  primaryButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryLink: { color: colors.blue, textAlign: 'center', fontWeight: '600', fontSize: 13.5 },
});
