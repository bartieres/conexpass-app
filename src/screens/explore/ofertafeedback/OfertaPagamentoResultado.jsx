
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../../../theme/theme';

function moeda(valor) {
  if (
    valor == null ||
    !Number.isFinite(Number(valor))
  ) {
    return '—';
  }

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function calcularValores(oferta) {
  const valor = Number(oferta?.valor);
  const promocional = Number(oferta?.valorPromocional);

  if (
    oferta?.valor == null ||
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    return {
      valorOriginal: null,
      valorFinal: null,
      temDesconto: false,
      desconto: null,
    };
  }

  const temDesconto =
    oferta?.valorPromocional != null &&
    Number.isFinite(promocional) &&
    promocional >= 0 &&
    promocional < valor;

  return {
    valorOriginal: valor,
    valorFinal: temDesconto ? promocional : valor,
    temDesconto,
    desconto:
      temDesconto && valor > 0
        ? Math.round(
            ((valor - promocional) / valor) * 100
          )
        : null,
  };
}

const STATUS = {
  CONFIRMADO: {
    icon: 'checkmark-circle',
    color: '#16A34A',
    bg: '#DCFCE7',
    titulo: 'Pagamento confirmado!',
    mensagem:
      'Sua contratação foi confirmada. O acesso ficará disponível em suas contratações.',
  },

  PENDENTE: {
    icon: 'time-outline',
    color: '#D97706',
    bg: '#FEF3C7',
    titulo: 'Aguardando confirmação',
    mensagem:
      'Recebemos sua solicitação. O acesso será liberado quando o pagamento for confirmado.',
  },

  RECUSADO: {
    icon: 'close-circle',
    color: '#DC2626',
    bg: '#FEE2E2',
    titulo: 'Pagamento não aprovado',
    mensagem:
      'Não foi possível aprovar o pagamento. Confira seu cartão principal e consulte a situação da cobrança antes de tentar novamente.',
  },
};

export default function OfertaPagamentoResultado({
  navigation,
  oferta,
  status,
  loading,
  error,
  onAtualizar,
}) {
  const estado = STATUS[status] || STATUS.PENDENTE;

  const {
    valorOriginal,
    valorFinal,
    temDesconto,
    desconto,
  } = calcularValores(oferta);

  const estabelecimentoNome =
    oferta?.estabelecimento?.name ||
    oferta?.estabelecimento?.nomeFantasia ||
    oferta?.estabelecimento?.razaoSocial ||
    '—';

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Resultado do pagamento
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* STATUS */}
        <View
          style={[
            styles.iconBg,
            { backgroundColor: estado.bg },
          ]}
        >
          <Ionicons
            name={estado.icon}
            size={58}
            color={estado.color}
          />
        </View>

        <Text style={styles.titulo}>
          {estado.titulo}
        </Text>

        <Text style={styles.mensagem}>
          {estado.mensagem}
        </Text>

        {/* RESUMO DA CONTRATAÇÃO */}
        <View style={styles.resumoCard}>
          <Text style={styles.sectionLabel}>
            RESUMO DA CONTRATAÇÃO
          </Text>

          <View style={styles.item}>
            <Text style={styles.label}>
              Estabelecimento
            </Text>

            <Text style={styles.valor}>
              {estabelecimentoNome}
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.label}>
              Oferta
            </Text>

            <Text style={styles.valor}>
              {oferta?.nome || '—'}
            </Text>
          </View>

          {/* VALOR ORIGINAL E PROMOCIONAL */}
          <View style={styles.item}>
            <Text style={styles.label}>
              Valor da oferta
            </Text>

            <View style={styles.valorContainer}>
              {temDesconto && (
                <Text style={styles.valorOriginal}>
                  {moeda(valorOriginal)}
                </Text>
              )}

              <Text style={styles.valor}>
                {moeda(valorFinal)}
              </Text>
            </View>
          </View>

          {/* DESCONTO */}
          {temDesconto && (
            <View style={styles.item}>
              <Text style={styles.label}>
                Desconto
              </Text>

              <View style={styles.descontoBadge}>
                <Text style={styles.descontoBadgeText}>
                  -{desconto}%
                </Text>
              </View>
            </View>
          )}

          {/* TOTAL */}
          <View style={[styles.item, styles.ultimo]}>
            <Text style={styles.totalLabel}>
              {oferta?.tipo?.codigo === 'RECORRENTE'
                ? 'Primeira cobrança'
                : 'Total da compra'}
            </Text>

            <Text style={styles.valorDestaque}>
              {moeda(valorFinal)}
            </Text>
          </View>
        </View>

        {loading && (
          <ActivityIndicator
            style={styles.loading}
            color={colors.blue}
          />
        )}

        {!!error && (
          <Text style={styles.error}>
            {error}
          </Text>
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        {status !== 'CONFIRMADO' && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onAtualizar}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons
              name="refresh-outline"
              size={17}
              color={colors.blue}
            />

            <Text style={styles.secondaryText}>
              Atualizar situação
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>
            Voltar para Explorar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  content: {
    padding: 22,
    alignItems: 'center',
    paddingBottom: 40,
  },

  iconBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 22,
  },

  titulo: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  mensagem: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },

  resumoCard: {
    marginTop: 32,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    padding: 18,
    width: '100%',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  ultimo: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginTop: 4,
  },

  label: {
    fontSize: 13,
    color: colors.textMuted,
    flexShrink: 1,
  },

  valor: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },

  valorContainer: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 1,
  },

  valorOriginal: {
    fontSize: 12,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },

  descontoBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },

  descontoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },

  valorDestaque: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.blue,
  },

  loading: {
    marginTop: 16,
  },

  error: {
    marginTop: 16,
    fontSize: 13,
    textAlign: 'center',
    color: '#B91C1C',
  },

  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },

  primaryButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.blue,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  secondaryText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '700',
  },
});
