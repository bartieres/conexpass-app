import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../../theme/theme';

// Mesma paleta de badge já usada na listagem (PlanosTab do EstablishmentDetail)
const TIPO_OFERTA_META = {
  RECORRENTE: {
    label: 'Recorrente',
    color: colors.blue,
    bg: '#DBEAFE',
    icon: 'sync-outline',
    totalLabel: 'Total da primeira cobrança',
    botaoLabel: 'Contratar plano',
  },
  PACOTE: {
    label: 'Pacote',
    color: '#7C3AED',
    bg: '#EDE9FE',
    icon: 'layers-outline',
    totalLabel: 'Total da compra',
    botaoLabel: 'Comprar pacote',
  },
  AVULSO: {
    label: 'Avulso',
    color: colors.success,
    bg: colors.successLight,
    icon: 'flash-outline',
    totalLabel: 'Total da compra',
    botaoLabel: 'Comprar acesso avulso',
  },
};

function formatarValor(valor) {
  if (valor == null) return '';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// `valorPromocional` só conta como desconto quando vier preenchido e menor
// que `valor` — mesma regra usada no PlanosTab do EstablishmentDetail.
function calcularDesconto(valor, valorPromocional) {
  if (!valor || valorPromocional == null || valorPromocional >= valor) {
    return null;
  }
  return Math.round(((valor - valorPromocional) / valor) * 100);
}

export default function OfertaDetail({
  navigation,
  oferta,
  loading,
  error,
  onRetry,
  onContratar,
}) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.blue} />
        <Text style={styles.loadingText}>Carregando oferta...</Text>
      </View>
    );
  }

  if (error || !oferta) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Não foi possível carregar a oferta</Text>
        {!!error && <Text style={styles.errorMessage}>{error}</Text>}
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = TIPO_OFERTA_META[oferta.tipo?.codigo] || {
    label: oferta.tipo?.descricao || oferta.tipo?.codigo,
    color: colors.textMuted,
    bg: colors.chipBg,
    icon: 'pricetag-outline',
    totalLabel: 'Total',
    botaoLabel: 'Confirmar',
  };

  const ehAssinatura =
    oferta.tipo?.codigo === 'ASSINATURA' ||
    oferta.tipo?.descricao?.toLowerCase() === 'assinatura';
  const botaoLabel = ehAssinatura
    ? 'Comprar assinatura'
    : meta.botaoLabel;

  const desconto = calcularDesconto(oferta.valor, oferta.valorPromocional);
  const temDesconto = desconto != null;
  const valorFinal = temDesconto ? oferta.valorPromocional : oferta.valor;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da oferta</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {!!oferta.estabelecimento?.image && (
          <Image
            source={{ uri: oferta.estabelecimento.image }}
            style={styles.image}
          />
        )}

        {!!oferta.estabelecimento?.name && (
          <Text style={styles.estabelecimentoNome}>
            {oferta.estabelecimento.name}
          </Text>
        )}

        <View style={styles.titleRow}>
          <Text style={styles.ofertaNome}>{oferta.nome}</Text>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={13} color={meta.color} />
            <Text style={[styles.badgeText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <View style={styles.precoRow}>
          {temDesconto && (
            <Text style={styles.precoOriginal}>
              {formatarValor(oferta.valor)}
            </Text>
          )}
          <Text style={styles.preco}>{formatarValor(valorFinal)}</Text>
          {temDesconto && (
            <View style={styles.descontoBadge}>
              <Text style={styles.descontoBadgeText}>-{desconto}%</Text>
            </View>
          )}
        </View>

        {!!oferta.descricao && (
          <Text style={styles.descricao}>{oferta.descricao}</Text>
        )}

        {!!oferta.beneficios?.length && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="checkmark" size={14} color={colors.blue} />
              </View>
              <Text style={styles.sectionTitle}>O que está incluído</Text>
            </View>

            <View style={styles.beneficiosCard}>
              {oferta.beneficios.map((item, index) => (
                <View key={index} style={styles.beneficioRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={17}
                    color={colors.success}
                  />
                  <Text style={styles.beneficioText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {!!oferta.condicoes?.length && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="document-text-outline" size={14} color={colors.blue} />
              </View>
              <Text style={styles.sectionTitle}>Condições de utilização</Text>
            </View>

            <View style={styles.condicoesCard}>
              {oferta.condicoes.map((condicao, index) => (
                <View
                  key={condicao.label}
                  style={[
                    styles.condicaoRow,
                    index < oferta.condicoes.length - 1 &&
                      styles.condicaoRowDivider,
                  ]}
                >
                  <Text style={styles.condicaoLabel}>{condicao.label}</Text>
                  <Text style={styles.condicaoValor} numberOfLines={2}>
                    {condicao.valor}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {!!oferta.informacoesImportantes?.length && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="information" size={14} color={colors.blue} />
              </View>
              <Text style={styles.sectionTitle}>Informações importantes</Text>
            </View>

            <View style={styles.infoCard}>
              {oferta.informacoesImportantes.map((item, index) => (
                <View key={index} style={styles.infoRow}>
                  <View style={styles.infoBullet} />
                  <Text style={styles.infoText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{meta.totalLabel}</Text>
          <View style={styles.totalValorRow}>
            {temDesconto && (
              <Text style={styles.totalValorOriginal}>
                {formatarValor(oferta.valor)}
              </Text>
            )}
            <Text style={styles.totalValor}>{formatarValor(valorFinal)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={onContratar}
        >
          <Text style={styles.ctaButtonText}>{botaoLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  content: { padding: 20, paddingBottom: 32 },

  image: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginBottom: 14,
  },
  estabelecimentoNome: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ofertaNome: { ...typography.h1, fontSize: 21, flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11.5, fontWeight: '700' },

  precoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  precoOriginal: {
    fontSize: 16,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  preco: { fontSize: 26, fontWeight: '800', color: colors.blue },
  descontoBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  descontoBadgeText: { fontSize: 12, fontWeight: '700', color: colors.success },

  descricao: {
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },

  beneficiosCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
  },
  beneficioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  beneficioText: { fontSize: 13, color: colors.text, flex: 1 },

  condicoesCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  condicaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 10,
  },
  condicaoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  condicaoLabel: { fontSize: 13, color: colors.textMuted },
  condicaoValor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    flexShrink: 1,
  },

  infoCard: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 14,
    gap: 10,
  },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.blue,
    marginTop: 6,
  },
  infoText: { fontSize: 12.5, color: colors.textMuted, flex: 1, lineHeight: 18 },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  totalLabel: { fontSize: 13, color: colors.textMuted },
  totalValorRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalValorOriginal: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  totalValor: { fontSize: 17, fontWeight: '800', color: colors.text },

  ctaButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: { marginTop: 14, fontSize: 14, color: '#6B7280' },

  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  backButton: { marginTop: 14, padding: 10 },
  backButtonText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
});
