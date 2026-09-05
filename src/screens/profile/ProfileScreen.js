import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../theme/theme';
import { USER } from '../../data/mock';
import { useAuth } from '../../context/AuthContext';

// Seções do menu, agrupadas como uma tela de configurações. Cada item pode
// navegar para uma tela (screen) ou disparar uma ação especial (action).
function buildMenuSections({ onLogout, onDeleteAccount }) {
  return [
    {
      title: 'Conta',
      items: [
        { icon: 'person-outline', label: 'Dados pessoais', screen: 'PersonalData' },
        { icon: 'shield-checkmark-outline', label: 'Segurança', screen: 'Security' },
      ],
    },
    {
      title: 'Preferências',
      items: [
        { icon: 'notifications-outline', label: 'Notificações', screen: 'Notifications' },
        { icon: 'location-outline', label: 'Localização', screen: 'Location' },
      ],
    },
    {
      title: 'Suporte',
      items: [
        { icon: 'help-circle-outline', label: 'Central de ajuda', screen: 'Help' },
        { icon: 'chatbubble-ellipses-outline', label: 'Fale conosco', screen: 'Contact' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: 'document-text-outline', label: 'Termos de uso', url: 'https://conexpass.com.br/termos-uso' },
        { icon: 'lock-closed-outline', label: 'Política de privacidade', url: 'https://conexpass.com.br/politica-privacidade' },
      ],
    },
    {
      title: 'Conta',
      items: [
        //uir conta', danger: true, action: onDeleteAccount },
        { icon: 'log-out-outline', label: 'Sair', danger: true, action: onLogout },
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
  // Nome e e-mail vêm direto do usuário autenticado (AuthContext).
  // O plano ainda usa o mock como fallback até o backend retornar esse dado
  // no payload do usuário — troque assim que /users/me trouxer o plano.
  const name = user?.nome || 'Usuário';
  const email = user?.email || '';
  const plan = user?.plan || USER.plan;

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

  const menuSections = buildMenuSections({ onLogout: logout, onDeleteAccount: handleDeleteAccount });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.planBadge}>
            <Ionicons name="star" size={11} color="#fff" />
            <Text style={styles.planBadgeText}>{plan}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {menuSections.map((section) => (
          <View key={section.title + section.items[0].label} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;
                const handlePress = () => {
                  if (typeof item.action === 'function') {
                    item.action();
                  } else if (item.url) {
                    // Abre no navegador do celular (Safari/Chrome), em vez
                    // de navegar para uma tela dentro do app.
                    Linking.openURL(item.url).catch(() => {
                      Alert.alert('Não foi possível abrir o link', 'Tente novamente em instantes.');
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
                  >
                    <View style={styles.menuLeft}>
                      <View style={[styles.menuIconWrap, item.danger && styles.menuIconWrapDanger]}>
                        <Ionicons name={item.icon} size={19} color={item.danger ? '#EF4444' : colors.blue} />
                      </View>
                      <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
                    </View>
                    {item.url ? (
                      <Ionicons name="open-outline" size={18} color={colors.textLight} />
                    ) : (
                      !item.danger && <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.blue,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800', color: '#fff' },
  email: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  planBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 32 },
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
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapDanger: { backgroundColor: '#FEE2E2' },
  menuLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  menuLabelDanger: { color: '#EF4444', fontWeight: '700' },
});