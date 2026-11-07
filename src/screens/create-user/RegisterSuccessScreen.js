import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadow } from '../../theme/theme';

export default function RegisterSuccessScreen({ route, navigation }) {
  const email = route.params?.email || '';
  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={require('../../assets/logo-conexpass.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="ConexPass"
        />
        <View style={styles.card}>
          <LinearGradient
            colors={['#E4EEFF', '#E6F6EF']}
            style={styles.iconBackdrop}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="mail-open-outline"
                size={42}
                color={colors.blue}
              />
            </View>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </LinearGradient>
          <Text style={styles.kicker}>FALTA SÓ MAIS UM PASSO</Text>
          <Text style={styles.title}>Confirme seu e-mail</Text>
          <Text style={styles.subtitle}>
            Enviamos um link de confirmação para
          </Text>
          {!!email && (
            <View style={styles.emailBox}>
              <Ionicons name="mail-outline" size={18} color={colors.blue} />
              <Text style={styles.emailText} selectable>
                {email}
              </Text>
            </View>
          )}
          <Text style={styles.helper}>
            Abra seu e-mail e toque no link para ativar sua conta.
          </Text>
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={21} color="#98651A" />
            <Text style={styles.tipText}>
              Não encontrou? Confira também a caixa de spam.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              Já confirmei, ir para login
            </Text>
            <Ionicons name="arrow-forward" size={19} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  logo: { width: 180, height: 38, alignSelf: 'center', marginBottom: 28 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  iconBackdrop: {
    width: 120,
    height: 120,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2B8B5B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '800',
    color: colors.blue,
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDF3FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    width: '100%',
  },
  emailText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.blueDark,
    fontWeight: '700',
  },
  helper: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7E5',
    borderRadius: 15,
    padding: 14,
    marginTop: 20,
    width: '100%',
  },
  tipText: { flex: 1, color: '#805F31', fontSize: 12, lineHeight: 19 },
  primaryButton: {
    backgroundColor: colors.blue,
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    marginTop: 24,
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'center',
  },
});
