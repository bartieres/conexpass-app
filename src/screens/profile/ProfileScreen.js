import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMinhasAssinaturas } from '../../services/assinaturaService';
import { derivarPainel, formatarDataPlano } from '../../utils/assinaturasPlano';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import appConfig from '../../../app.json';

const appVersion = appConfig.expo.version;

// Seções do menu, agrupadas como uma tela de configurações. Cada item pode
// navegar para uma tela (screen) ou disparar uma ação especial (action).
function buildMenuSections({ onLogout, onDeleteAccount }) {
  return [
    {
      title: 'Conta',
      items: [
        {
          icon: 'person-outline',
          label: 'Dados pessoais',
          screen: 'PersonalData',
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Segurança',
          screen: 'Security',
        },
      ],
    },
    {
      title: 'Preferências',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notificações',
          screen: 'Notification',
        },
        { icon: 'location-outline', label: 'Localização', screen: 'Location' },
      ],
    },
    {
      title: 'Pagamentos',
      items: [
        {
          icon: 'card-outline',
          label: 'Forma de pagamento',
          screen: 'PaymentMethod',
        },
        {
          icon: 'receipt-outline',
          label: 'Pagamentos',
          screen: 'Payment',
        },
      ],
    },
    {
      title: 'Suporte',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Central de ajuda',
          screen: 'Help',
        },
        {
          icon: 'chatbubble-ellipses-outline',
          label: 'Fale conosco',
          screen: 'Contact',
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: 'document-text-outline',
          label: 'Termos de uso',
          url: 'https://conexpass.com.br/termos-uso',
        },
        {
          icon: 'lock-closed-outline',
          label: 'Política de privacidade',
          url: 'https://conexpass.com.br/politica-privacidade',
        },
      ],
    },
    {
      title: 'Sessão',
      items: [
        //uir conta', danger: true, action: onDeleteAccount },
        {
          icon: 'log-out-outline',
          label: 'Sair',
          danger: true,
          action: onLogout,
        },
      ],
    },
  ];
}

// Gera as iniciais a partir do nome, pra usar como avatar enquanto não há
// upload de foto (ex: "André Silva" -> "AS")
function getInitials(name = '') {
  const partes = name.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const name = user?.nome || 'Usuário';
  const email = user?.email || '';
  const [assinatura, setAssinatura] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      getMinhasAssinaturas()
        .then(({ response }) => {
          const { planoAtual } = derivarPainel(response);
          if (ativo)
            setAssinatura(
              planoAtual?.podeUtilizar === true ? planoAtual : null
            );
        })
        .catch(() => {
          // A falha de consulta não deve exibir um plano desatualizado como ativo.
          if (ativo) setAssinatura(null);
        });
      return () => {
        ativo = false;
      };
    }, [])
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Essa ação é permanente e não pode ser desfeita. Tem certeza que deseja excluir sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            // TODO: chamar o endpoint de exclusão de conta no backend
            // e então fazer logout / limpar sessão.
          },
        },
      ]
    );
  };

  const menuSections = buildMenuSections({
    onLogout: logout,
    onDeleteAccount: handleDeleteAccount,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.headerDecoration} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.pageTitle}>Perfil</Text>
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.blueLight, colors.blue, colors.blueDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarPlaceholder}
          >
            <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{name}</Text>
            {!!email && <Text style={styles.email}>{email}</Text>}
          </View>
        </View>
        {assinatura && (
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => navigation.navigate('Plano')}
            accessibilityRole="button"
            accessibilityLabel={`Gerenciar plano ConexPass ${assinatura.plano.nome}`}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F4F8FF', '#E5EEFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planCardContent}
            >
              <View style={styles.planIcon}>
                <Ionicons name="ribbon-outline" size={29} color={colors.blue} />
              </View>
              <View style={styles.planInfo}>
                <View style={styles.planTitleRow}>
                  <Text style={styles.planName}>
                    ConexPass {assinatura.plano.nome}
                  </Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>
                      {assinatura.renovacaoAutomatica === false
                        ? 'Em uso'
                        : 'Ativo'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.planDescription}>
                  {assinatura.renovacaoAutomatica === false
                    ? `Renovação cancelada.${assinatura.fimVigencia ? ` Disponível até ${formatarDataPlano(assinatura.fimVigencia, true)}.` : ''}`
                    : 'Seu plano de acesso aos estabelecimentos parceiros.'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.textMuted}
              />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {menuSections.map((section) => (
          <View
            key={section.title + section.items[0].label}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.sectionCard}>
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;

                const handlePress = () => {
                  if (typeof item.action === 'function') {
                    item.action();
                  } else if (item.url) {
                    Linking.openURL(item.url).catch(() => {
                      Alert.alert(
                        'Não foi possível abrir o link',
                        'Tente novamente em instantes.'
                      );
                    });
                  } else if (item.screen) {
                    navigation.navigate(item.screen);
                  }
                };

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, !isLast && styles.menuItemDivider]}
                    onPress={handlePress}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <View style={styles.menuLeft}>
                      <View
                        style={[
                          styles.menuIconWrap,
                          item.danger && styles.menuIconWrapDanger,
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={19}
                          color={item.danger ? '#EF4444' : colors.blue}
                        />
                      </View>

                      <Text
                        style={[
                          styles.menuLabel,
                          item.danger && styles.menuLabelDanger,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {item.url ? (
                      <Ionicons
                        name="open-outline"
                        size={18}
                        color={colors.textLight}
                      />
                    ) : (
                      !item.danger && (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textLight}
                        />
                      )
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.appVersion}>
          <Text style={styles.appName}>ConexPass</Text>
          <Text style={styles.versionText}>Versão {appVersion}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FF' },
  headerDecoration: {
    position: 'absolute',
    top: -195,
    left: -65,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#E5EEFF',
  },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 4,
    marginBottom: 28,
  },
  avatarPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 27, fontWeight: '800' },
  userInfo: { flex: 1, gap: 5 },
  name: { fontSize: 25, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  planCard: {
    borderRadius: 22,
    backgroundColor: '#fff',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2EAFE',
    ...shadow,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    overflow: 'hidden',
  },
  planIcon: {
    width: 54,
    height: 58,
    borderRadius: 17,
    backgroundColor: '#E0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: { flex: 1 },
  planTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
  },
  planName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  planBadge: {
    backgroundColor: '#DCF4CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  planBadgeText: { color: '#236B24', fontSize: 11, fontWeight: '800' },
  planDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 9,
    marginLeft: 10,
  },
  sectionCard: { backgroundColor: '#fff', borderRadius: 22, ...shadow },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  menuItemDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapDanger: { backgroundColor: '#FFE8EB' },
  menuLabel: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
  },
  menuLabelDanger: { color: '#E52938', fontWeight: '700' },
  appVersion: { alignItems: 'center', paddingTop: 4, paddingBottom: 8 },
  appName: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  versionText: { fontSize: 11, color: colors.textLight, marginTop: 2 },
});
