import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

const TABS = [
  { key: 'Explorar', label: 'Explorar', icon: 'search-outline', iconActive: 'search' },
  { key: 'Historico', label: 'Histórico', icon: 'time-outline', iconActive: 'time' },
  { key: 'CheckIn', label: 'Check-in', icon: 'qr-code-outline', iconActive: 'qr-code', center: true },
  { key: 'Planos', label: 'Planos', icon: 'card-outline', iconActive: 'card' },
  { key: 'Perfil', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
];

export default function BottomNav({ state, navigation }) {
  const activeRoute = state.routes[state.index].name;

  return (
    <View style={styles.wrapper}>
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.key;
        if (tab.center) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.centerButton}
              onPress={() => navigation.navigate(tab.key)}
              activeOpacity={0.85}
            >
              <View style={[styles.centerCircle, isActive && styles.centerCircleActive]}>
                <Ionicons name={isActive ? tab.iconActive : tab.icon} size={24} color="#fff" />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => navigation.navigate(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? colors.blue : colors.textLight}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  centerButton: {
    flex: 1,
    alignItems: 'center',
    marginTop: -26,
    gap: 4,
  },
  centerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#fff',
  },
  centerCircleActive: {
    backgroundColor: colors.blueDark,
  },
  label: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.blue,
    fontWeight: '700',
  },
});
