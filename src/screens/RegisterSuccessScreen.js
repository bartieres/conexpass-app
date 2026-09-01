import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/theme';

export default function RegisterSuccessScreen({ route, navigation }) {
  const email = route.params?.email || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={44} color="#fff" />
        </View>

        <Text style={styles.title}>Confirme seu e-mail</Text>
        <Text style={styles.subtitle}>
          Enviamos um link de confirmação para{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.helper}>
          Abra seu e-mail e toque no link para ativar sua conta. Não esqueça de
          checar a caixa de spam.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.primaryButtonText}>Já confirmei, ir para login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  emailText: { fontWeight: '700', color: colors.text },
  helper: { fontSize: 12.5, color: colors.textLight, textAlign: 'center', lineHeight: 18 },
  footer: { padding: 24 },
  primaryButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
