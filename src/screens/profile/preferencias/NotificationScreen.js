import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../../theme/theme';
import { userService } from '../../../services/userService';

/**
 * Item de notificação com Switch.
 * - Quando `disabled` é true, o toggle fica visível mas travado (opção
 *   "futura", ainda sem suporte no backend) — mostra "Em breve" no lugar
 *   da ação real.
 */
function NotificationItem({ label, description, value, onValueChange, disabled, isLast }) {
  return (
    <View style={[styles.item, !isLast && styles.itemDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, disabled && styles.itemLabelDisabled]}>{label}</Text>
        {!!description && <Text style={styles.itemDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.blue }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function NotificationScreen({ navigation }) {
  // Único toggle funcional por enquanto — os outros três já existem na UI,
  // mas ainda não têm suporte no backend (ver comentário mais abaixo).
  const [conexpassInfo, setConexpassInfo] = useState(true);
  const [savingConexpassInfo, setSavingConexpassInfo] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // TODO: esses três ainda serão implementados no backend. Os valores abaixo
  // são só os padrões exibidos por enquanto (não persistem nada e o toggle
  // fica desabilitado).
  const [planUpdates] = useState(true);
  const [checkin] = useState(true);
  const [offers] = useState(false);

  // Busca o valor real salvo no backend ao abrir a tela, em vez de assumir
  // sempre o padrão "ligado".
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        // TODO: confirmar o formato exato retornado pelo endpoint de preferências
        const preferencias = await userService.getNotificationPreferences();
        setConexpassInfo(preferencias?.conexpassInfo ?? true);
      } catch (err) {
        setLoadError(err.friendlyMessage || 'Não foi possível carregar suas preferências.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggleConexpassInfo = async (novoValor) => {
    const valorAnterior = conexpassInfo;
    setConexpassInfo(novoValor); // atualização otimista
    setSavingConexpassInfo(true);
    try {
      // TODO: confirmar o formato exato esperado pelo endpoint de preferências
      await userService.updateNotificationPreferences({ conexpassInfo: novoValor });
    } catch (err) {
      // reverte se a chamada falhar
      setConexpassInfo(valorAnterior);
      Alert.alert('Não foi possível salvar', err.friendlyMessage || 'Tente novamente em instantes.');
    } finally {
      setSavingConexpassInfo(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
            <Text style={styles.stateText}>Carregando preferências...</Text>
          </View>
        )}

        {!loading && !!loadError && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
            <Text style={styles.stateText}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comunicações</Text>
            <View style={styles.sectionCard}>
              <NotificationItem
                label="Informações do ConexPass"
                value={conexpassInfo}
                onValueChange={handleToggleConexpassInfo}
                disabled={savingConexpassInfo}
              />
              <NotificationItem
                label="Atualizações do plano"
                description="Em breve"
                value={planUpdates}
                disabled
                isLast={false}
              />
              <NotificationItem
                label="Check-in"
                description="Em breve"
                value={checkin}
                disabled
                isLast={false}
              />
              <NotificationItem
                label="Ofertas e novidades"
                description="Em breve"
                value={offers}
                disabled
                isLast
              />
            </View>
          </View>
        )}
      </ScrollView>
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
  body: { padding: 16, paddingTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
  itemLabelDisabled: { color: colors.textMuted },
  itemDescription: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
