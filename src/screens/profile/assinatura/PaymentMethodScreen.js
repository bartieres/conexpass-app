import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow } from '../../../theme/theme';
import {
  getFormaPagamento,
  updatePrincipal,
  deleteFormaPagamento,
} from '../../../services/formaPagamentoService';

const BANDEIRA_ICON = {
  MASTERCARD: 'card',
  VISA: 'card',
  ELO: 'card',
};

export default function PaymentMethodScreen({ navigation }) {
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscarCartoes = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getFormaPagamento();

      const { response } = data;

      setCartoes(response || []);
    } catch (err) {
      setError(
        err.friendlyMessage || 'Não foi possível carregar seus cartões.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      buscarCartoes();
    }, [buscarCartoes])
  );

  const handleAdicionarCartao = () => {
    navigation.navigate('RegisterCard');
  };

  const handleDefinirPadrao = (cartao) => {
    if (cartao.principal) {
      return;
    }

    Alert.alert(
      'Definir cartão padrão',
      `Deseja utilizar o cartão •••• ${cartao.cartao.ultimosDigitos} como padrão para as próximas cobranças?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            await updatePrincipal(cartao.id);
            await buscarCartoes();
          },
        },
      ]
    );
  };

  const handleExcluirCartao = (cartao) => {
    if (cartao.principal && cartoes.length === 1) {
      Alert.alert(
        'Não é possível excluir',
        'Cadastre outro cartão antes de excluir o cartão utilizado atualmente nas cobranças.'
      );

      return;
    }

    Alert.alert(
      'Excluir cartão',
      `Deseja realmente excluir o cartão •••• ${cartao.cartao.ultimosDigitos}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteFormaPagamento(cartao.id);
            await buscarCartoes();
          },
        },
      ]
    );
  };

  const renderCartao = ({ item }) => {
    const codigoBandeira = item.cartao?.bandeira?.codigo;

    return (
      <View style={styles.cardBox}>
        <View style={styles.cardIconWrap}>
          <Ionicons
            name={BANDEIRA_ICON[codigoBandeira] || 'card'}
            size={22}
            color={colors.blue}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardBrand}>
              {item.cartao?.bandeira?.descricao ||
                item.cartao?.bandeira ||
                'Cartão'}{' '}
              •••• {item.cartao?.ultimosDigitos}
            </Text>

            {item.principal && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Padrão</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardExpiry}>
            Vencimento {item.cartao?.validade}
          </Text>

          <View style={styles.cardActions}>
            {!item.principal && (
              <TouchableOpacity onPress={() => handleDefinirPadrao(item)}>
                <Text style={styles.actionText}>Usar como padrão</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => handleExcluirCartao(item)}>
              <Text style={styles.deleteText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
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

            <TouchableOpacity
              style={styles.stateButton}
              onPress={buscarCartoes}
            >
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <>
            {cartoes.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Meus cartões</Text>

                <FlatList
                  data={cartoes}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderCartao}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              </>
            ) : (
              <View style={styles.stateBox}>
                <Ionicons
                  name="card-outline"
                  size={30}
                  color={colors.textLight}
                />

                <Text style={styles.stateText}>
                  Nenhum cartão cadastrado ainda.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdicionarCartao}
            >
              <Ionicons name="add" size={20} color={colors.blue} />

              <Text style={styles.addButtonText}>Adicionar cartão</Text>
            </TouchableOpacity>

            {cartoes.length > 0 && (
              <Text style={styles.footerNote}>
                O cartão padrão será utilizado nas próximas cobranças da
                assinatura.
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

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

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },

  stateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },

  stateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },

  listContent: {
    paddingBottom: 8,
  },

  cardBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },

  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  cardBrand: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
  },

  defaultBadge: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  defaultBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.blue,
  },

  cardExpiry: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 12,
  },

  actionText: {
    color: colors.blue,
    fontWeight: '700',
    fontSize: 12.5,
  },

  deleteText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12.5,
  },

  addButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
  },

  addButtonText: {
    color: colors.blue,
    fontWeight: '700',
    fontSize: 14,
  },

  footerNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});
