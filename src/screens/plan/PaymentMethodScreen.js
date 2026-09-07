import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';
import { getCartaoAtual } from '../../services/cartaoService';

const BANDEIRA_ICON = {
  MASTERCARD: 'card',
  VISA: 'card',
  ELO: 'card',
};

export default function PaymentMethodScreen({ navigation }) {
  const [cartao, setCartao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscarCartao = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: confirmar endpoint/formato exato no backend
      const data = await getCartaoAtual();
      setCartao(data);
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar sua forma de pagamento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarCartao();
  }, [buscarCartao]);

  const handleAlterarCartao = () => {
    // TODO: essa tela ainda não existe — provavelmente vai abrir um checkout
    // de tokenização de cartão (Stripe/Pagar.me/etc). Por enquanto só avisa.
    Alert.alert('Em breve', 'A alteração de cartão estará disponível em breve.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forma de pagamento</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.stateButton} onPress={buscarCartao}>
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && cartao && (
          <>
            <Text style={styles.sectionTitle}>Cartão cadastrado</Text>
            <View style={styles.cardBox}>
              <View style={styles.cardIconWrap}>
                <Ionicons name={BANDEIRA_ICON[cartao.bandeira] || 'card'} size={22} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardBrand}>
                  {cartao.bandeira} •••• {cartao.ultimosDigitos}
                </Text>
                <Text style={styles.cardExpiry}>Vencimento {cartao.validade}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.changeButton} onPress={handleAlterarCartao}>
              <Text style={styles.changeButtonText}>Alterar cartão</Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Seu cartão será utilizado para as próximas cobranças da assinatura.
            </Text>
          </>
        )}

        {!loading && !error && !cartao && (
          <View style={styles.stateBox}>
            <Ionicons name="card-outline" size={30} color={colors.textLight} />
            <Text style={styles.stateText}>Nenhum cartão cadastrado ainda.</Text>
            <TouchableOpacity style={styles.stateButton} onPress={handleAlterarCartao}>
              <Text style={styles.stateButtonText}>Cadastrar cartão</Text>
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

  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 16,
    ...shadow,
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrand: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardExpiry: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },

  changeButton: {
    backgroundColor: colors.chipBg,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },

  footerNote: { fontSize: 12, color: colors.textLight, textAlign: 'center', marginTop: 16, lineHeight: 17 },
});
