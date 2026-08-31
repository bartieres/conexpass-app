import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../theme/theme';
import { USER } from '../data/mock';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { icon: 'card-outline', label: 'Meu plano', screen: 'Plan' },
  { icon: 'person-outline', label: 'Dados pessoais' },
  { icon: 'wallet-outline', label: 'Pagamento' },
  { icon: 'notifications-outline', label: 'Notificações' },
  { icon: 'people-outline', label: 'Indique amigos', badge: 'Ganhe benefícios' },
  { icon: 'help-circle-outline', label: 'Ajuda e suporte' },
  { icon: 'settings-outline', label: 'Configurações' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  // Enquanto o backend não retorna todos os campos (ex: avatar, plano),
  // completa com o mock só para exibição — troque conforme o payload real de /users/me
  const profile = { ...USER, ...user };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <View style={styles.planBadge}>
            <Ionicons name="star" size={11} color="#fff" />
            <Text style={styles.planBadgeText}>{profile.plan}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.menuList}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={19} color={colors.blue} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutItem} onPress={logout}>
          <Ionicons name="log-out-outline" size={19} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
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
  avatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: '#fff' },
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
  menuList: { padding: 16, gap: 4 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 4,
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
  menuLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: { backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  menuBadgeText: { color: colors.success, fontSize: 10.5, fontWeight: '700' },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});
