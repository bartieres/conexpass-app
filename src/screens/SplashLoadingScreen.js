import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import Logo from '../assets/logo.png';

export default function SplashLoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={Logo}
        style={{ height: 130, resizeMode: 'contain' }}
      />
      <ActivityIndicator size="small" color={colors.blue} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: { fontSize: 22, fontWeight: '800', color: colors.blue },
});
