import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow } from '../../../theme/theme';

/**
 * Status possíveis:
 * - 'checking': ainda consultando a permissão do sistema
 * - 'granted': localização permitida
 * - 'denied': localização negada (pode ou não dar pra pedir de novo)
 */
export default function LocationScreen({ navigation }) {
  const [status, setStatus] = useState('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const checkPermission = useCallback(async () => {
    const permissao = await Location.getForegroundPermissionsAsync();
    setStatus(permissao.status === 'granted' ? 'granted' : 'denied');
    setCanAskAgain(permissao.canAskAgain);
  }, []);

  // Reconfere sempre que a tela ganha foco — cobre o caso do usuário ter
  // ido nas Configurações do celular (fora do app) e voltado.
  useFocusEffect(
    useCallback(() => {
      checkPermission();
    }, [checkPermission])
  );

  const handlePermitir = async () => {
    // Se o usuário já negou antes e o sistema não deixa mais perguntar de
    // novo pelo popup nativo (comportamento padrão do iOS e, em alguns
    // casos, do Android), a única saída é abrir as Configurações do app.
    if (status === 'denied' && !canAskAgain) {
      Linking.openSettings();
      return;
    }

    setRequesting(true);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      setStatus(permissao.status === 'granted' ? 'granted' : 'denied');
      setCanAskAgain(permissao.canAskAgain);
    } finally {
      setRequesting(false);
    }
  };

  // "Gerenciar permissão" sempre leva pras Configurações — é onde o usuário
  // consegue revogar o acesso manualmente caso queira desativar depois.
  const handleGerenciar = () => {
    Linking.openSettings();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Localização</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.description}>
          Sua localização é utilizada para encontrar estabelecimentos próximos a você.
        </Text>

        {status === 'checking' && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {status === 'granted' && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Permissão de localização</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Permitida</Text>
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleGerenciar}>
              <Text style={styles.secondaryButtonText}>Gerenciar permissão</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'denied' && (
          <View style={styles.deniedCard}>
            <Ionicons name="location-outline" size={36} color={colors.textLight} />
            <Text style={styles.deniedTitle}>Localização desativada</Text>
            <Text style={styles.deniedText}>
              Para encontrar estabelecimentos próximos, permita o acesso à sua localização.
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handlePermitir} disabled={requesting}>
              {requesting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Permitir localização</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  body: { padding: 20, paddingTop: 4 },
  description: { fontSize: 13.5, color: colors.textMuted, lineHeight: 19, marginBottom: 20 },
  stateBox: { alignItems: 'center', paddingVertical: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 18,
    ...shadow,
  },
  cardLabel: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  statusDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.success },
  statusText: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  secondaryButton: {
    backgroundColor: colors.chipBg,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },
  deniedCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    ...shadow,
  },
  deniedTitle: { fontSize: 15.5, fontWeight: '800', color: colors.text, marginTop: 4 },
  deniedText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  primaryButton: {
    backgroundColor: colors.blue,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
});
