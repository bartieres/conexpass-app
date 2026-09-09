import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';

export default function CheckInSuccessScreen({ route, navigation }) {
  const estabelecimento = route?.params?.estabelecimento;

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Anel que expande e desaparece por trás do ícone, só de enfeite.
    // Roda só 2 vezes e para — não precisa ficar pulsando pra sempre
    // enquanto o usuário decide o que fazer.
    Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.6,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 }
    ).start();
  }, [scale, opacity, ringScale, ringOpacity]);

  // Sem navegação automática: essa tela é o resultado de uma ação que o
  // próprio usuário iniciou, então a escolha do próximo passo (ver
  // check-ins ou voltar a explorar) fica com ele, sem pressa.

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale }] }}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={46} color="#fff" />
            </View>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity }}>
          <Text style={styles.title}>Check-in confirmado!</Text>
          {!!estabelecimento?.name && (
            <Text style={styles.subtitle}>Você acabou de fazer check-in em {estabelecimento.name}.</Text>
          )}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace('CheckIns')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Ver meus check-ins</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.replace('Explorar')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Voltar para Explorar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  ring: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.success,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  title: { fontSize: 21, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  footer: { padding: 20, paddingBottom: 30, gap: 10 },
  primaryButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { height: 46, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },
});
