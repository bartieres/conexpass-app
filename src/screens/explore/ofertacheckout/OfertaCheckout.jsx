import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  radius,
  typography,
} from '../../../theme/theme';

const TIPO_OFERTA_META = {
  RECORRENTE: {
    label: 'Recorrente',
    color: colors.blue,
    bg: '#DBEAFE',
    icon: 'sync-outline',
    totalLabel: 'Total da primeira cobrança',
  },
  PACOTE: {
    label: 'Pacote',
    color: '#7C3AED',
    bg: '#EDE9FE',
    icon: 'layers-outline',
    totalLabel: 'Total da compra',
  },
  AVULSO: {
    label: 'Avulso',
    color: colors.success,
    bg: colors.successLight,
    icon: 'flash-outline',
    totalLabel: 'Total da compra',
  },
};

function formatarValor(valor) {
  if (valor == null) return '';

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function InfoRow({ icon, children }) {
  if (!children) return null;

  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon}
        size={17}
        color={colors.blue}
      />

      <Text style={styles.infoText}>
        {children}
      </Text>
    </View>
  );
}

export default function OfertaCheckout({
  navigation,
  resumo,
  onContinuar,
}) {
  if (!resumo) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color={colors.textMuted}
        />

        <Text style={styles.emptyTitle}>
          Não foi possível carregar o resumo
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = TIPO_OFERTA_META[
    resumo.tipo?.codigo
  ] || {
    label: resumo.tipo?.descricao || 'Oferta',
    color: colors.textMuted,
    bg: colors.chipBg,
    icon: 'pricetag-outline',
    totalLabel: 'Total da compra',
  };

  const estabelecimento = resumo.estabelecimento || {};

  const cidade = estabelecimento.cidade;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Resumo da contratação
        </Text>

        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        bounces={false}
      >
        {/* ESTABELECIMENTO */}
        <Text style={styles.sectionLabel}>
          ESTABELECIMENTO
        </Text>

        <View style={styles.estabelecimentoRow}>
          {estabelecimento.image ? (
            <Image
              source={{ uri: estabelecimento.image }}
              style={styles.estabelecimentoImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="business-outline"
                size={28}
                color={colors.textMuted}
              />
            </View>
          )}

          <View style={styles.estabelecimentoInfo}>
            <Text style={styles.estabelecimentoNome}>
              {estabelecimento.name || 'Estabelecimento'}
            </Text>

            {!!cidade && (
              <Text style={styles.estabelecimentoLocal}>
                {cidade}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* OFERTA SELECIONADA */}
        <Text style={styles.sectionLabel}>
          OFERTA SELECIONADA
        </Text>

        <View style={styles.ofertaCard}>
          <View style={styles.ofertaHeader}>
            <Text style={styles.ofertaNome}>
              {resumo.nome}
            </Text>

            <View
              style={[
                styles.badge,
                { backgroundColor: meta.bg },
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={13}
                color={meta.color}
              />

              <Text
                style={[
                  styles.badgeText,
                  { color: meta.color },
                ]}
              >
                {meta.label}
              </Text>
            </View>
          </View>

          {!!resumo.modalidades && (
            <Text style={styles.ofertaDescricao}>
              {resumo.modalidades}
            </Text>
          )}

          {!resumo.modalidades && !!resumo.descricao && (
            <Text style={styles.ofertaDescricao}>
              {resumo.descricao}
            </Text>
          )}

          {!!resumo.quantidadeAcessos && (
            <InfoRow icon="ticket-outline">
              {resumo.quantidadeAcessos}
            </InfoRow>
          )}

          {!!resumo.validade && (
            <InfoRow icon="calendar-outline">
              {resumo.validade}
            </InfoRow>
          )}

          {!!resumo.cobranca && resumo.recorrente && (
            <InfoRow icon="repeat-outline">
              Cobrança: {resumo.cobranca}
            </InfoRow>
          )}

          {!!estabelecimento.name && (
            <InfoRow icon="location-outline">
              Válido em {estabelecimento.name}
            </InfoRow>
          )}
        </View>

        {/* RESUMO DOS VALORES */}
        <Text style={styles.valoresTitle}>
          Resumo dos valores
        </Text>

        <View style={styles.valoresCard}>
          <View style={styles.valorItemRow}>
            <Text style={styles.valorItemLabel}>
              {resumo.nome}
            </Text>

            <Text style={styles.valorItemValor}>
              {formatarValor(resumo.valor)}
            </Text>
          </View>

          <View style={styles.valoresDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {meta.totalLabel}
            </Text>

            <Text style={styles.totalValor}>
              {formatarValor(resumo.valor)}
            </Text>
          </View>
        </View>

        {/* INFORMAÇÃO */}
        <View style={styles.avisoRow}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.blue}
          />

          <Text style={styles.avisoText}>
            O acesso será disponibilizado após a
            confirmação do pagamento. As condições
            de utilização da oferta permanecem
            aplicáveis.
          </Text>
        </View>
      </ScrollView>

      {/* BOTÃO FIXO */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={onContinuar}
        >
          <Text style={styles.ctaButtonText}>
            Continuar para pagamento
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color="#fff"
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backIcon: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  content: {
    padding: 20,
    paddingBottom: 32,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  estabelecimentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  estabelecimentoImage: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
  },

  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  estabelecimentoInfo: {
    flex: 1,
  },

  estabelecimentoNome: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },

  estabelecimentoLocal: {
    marginTop: 5,
    fontSize: 13,
    color: colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 22,
  },

  ofertaCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    gap: 12,
  },

  ofertaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },

  ofertaNome: {
    ...typography.h1,
    fontSize: 17,
    flex: 1,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },

  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  ofertaDescricao: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },

  valoresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 26,
    marginBottom: 12,
  },

  valoresCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 16,
  },

  valorItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  valorItemLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },

  valorItemValor: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },

  valoresDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },

  totalValor: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.blue,
  },

  avisoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
  },

  avisoText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 19,
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },

  ctaButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  ctaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
  },

  backButton: {
    marginTop: 20,
    padding: 12,
  },

  backButtonText: {
    color: colors.blue,
    fontWeight: '600',
  },
});
