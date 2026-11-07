import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileIntro from '../components/ProfileIntro';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../../../theme/theme';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../../services/notificacaoService';

/**
 * Item de notificação com Switch.
 * - Quando `disabled` é true, o toggle fica visível mas travado (opção
 *   "futura", ainda sem suporte no backend) — mostra "Em breve" no lugar
 *   da ação real.
 */
function NotificationItem({
  label,
  icon,
  description,
  value,
  onValueChange,
  disabled,
  isLast,
}) {
  return (
    <View style={[styles.item, !isLast && styles.itemDivider]}>
      <View style={styles.notificationIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={disabled ? colors.textLight : colors.blue}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, disabled && styles.itemLabelDisabled]}>
          {label}
        </Text>
        {!!description && (
          <Text style={styles.itemDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        accessibilityLabel={label}
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
  const [planUpdates] = useState(false);
  const [checkin] = useState(false);
  const [offers] = useState(false);

  // Busca o valor real salvo no backend ao abrir a tela, em vez de assumir
  // sempre o padrão "ligado".
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        // TODO: confirmar o formato exato retornado pelo endpoint de preferências
        const preferencias = await getNotificationPreferences();
        setConexpassInfo(
          typeof preferencias?.conexpassInfo === 'boolean'
            ? preferencias.conexpassInfo
            : true
        );
      } catch (err) {
        setLoadError(
          err.friendlyMessage || 'Não foi possível carregar suas preferências.'
        );
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
      await updateNotificationPreferences({ conexpassInfo: novoValor });
    } catch (err) {
      // reverte se a chamada falhar
      setConexpassInfo(valorAnterior);
      Alert.alert(
        'Não foi possível salvar',
        err.friendlyMessage || 'Tente novamente em instantes.'
      );
    } finally {
      setSavingConexpassInfo(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <ProfileIntro
          icon="notifications-outline"
          title="Novidades no seu ritmo"
          description="Escolha quais comunicações do ConexPass deseja receber."
          tone="purple"
        />
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
                description={
                  savingConexpassInfo
                    ? 'Salvando preferência...'
                    : 'Comunicações gerais do aplicativo'
                }
                label="Informações do ConexPass"
                icon="information-circle-outline"
                value={conexpassInfo}
                onValueChange={handleToggleConexpassInfo}
                disabled={savingConexpassInfo}
              />
              <NotificationItem
                label="Atualizações do plano"
                icon="layers-outline"
                description="Em breve"
                value={planUpdates}
                disabled
                isLast={false}
              />
              <NotificationItem
                label="Check-in"
                icon="qr-code-outline"
                description="Em breve"
                value={checkin}
                disabled
                isLast={false}
              />
              <NotificationItem
                label="Ofertas e novidades"
                icon="pricetags-outline"
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
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF3FF',
  },
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'center',
  },
  body: { paddingBottom: 32, padding: 16, paddingTop: 8 },
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 22,
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
  stateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
