import { useState, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow } from '../../theme/theme';
import { findAllByCondition } from '../../services/planoService';

const TAMANHO_PAGINA = 50;

function formatarMoeda(valor) {
  if (valor == null) return '';

  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function calcularDesconto(valorOriginal, valor) {
  if (!valorOriginal || valorOriginal <= valor) return null;

  return Math.round((1 - valor / valorOriginal) * 100);
}

function PlanCard({ plano, isAtual, onSelect }) {
  const desconto = calcularDesconto(
    plano.valorOriginal,
    plano.valor
  );

  const destacarComoRecomendado =
    plano.recomendado && !isAtual;

  return (
    <View
      style={[
        styles.planCard,
        isAtual && styles.planCardAtual,
        destacarComoRecomendado && styles.planCardRecomendado,
      ]}
    >
      {destacarComoRecomendado && (
        <View style={styles.recommendedRibbon}>
          <Ionicons
            name="star"
            size={12}
            color="#fff"
          />

          <Text style={styles.recommendedRibbonText}>
            Recomendado
          </Text>
        </View>
      )}

      <View style={styles.planCardHeader}>
        <Text style={styles.planCardName}>
          {plano.nome}
        </Text>

        {isAtual && (
          <View style={styles.currentTag}>
            <Text style={styles.currentTagText}>
              Seu plano atual
            </Text>
          </View>
        )}

        {!isAtual && !!desconto && (
          <View style={styles.discountTag}>
            <Text style={styles.discountTagText}>
              -{desconto}%
            </Text>
          </View>
        )}
      </View>

      {!!plano.descricao && (
        <Text style={styles.planDescription}>
          {plano.descricao}
        </Text>
      )}

      <View style={styles.priceRow}>
        {!!plano.valorOriginal &&
          plano.valorOriginal > plano.valor && (
            <Text style={styles.priceOriginal}>
              de {formatarMoeda(plano.valorOriginal)}
            </Text>
          )}

        <Text style={styles.priceValue}>
          {!!plano.valorOriginal &&
          plano.valorOriginal > plano.valor
            ? 'por '
            : ''}

          <Text style={styles.priceValueNumber}>
            {formatarMoeda(plano.valor)}
          </Text>

          <Text style={styles.priceValueSuffix}>
            /mês
          </Text>
        </Text>
      </View>

      <View style={styles.checkinRow}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={colors.blue}
        />

        <Text style={styles.checkinText}>
          {plano.checkinsPorDia}x check-in por dia
        </Text>
      </View>

      {!!plano.beneficios?.length && (
        <View style={styles.beneficiosList}>
          {plano.beneficios.map((beneficio) => (
            <View
              key={beneficio}
              style={styles.beneficioRow}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />

              <Text style={styles.beneficioText}>
                {beneficio}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          isAtual && styles.selectButtonAtual,
        ]}
        onPress={() => onSelect(plano)}
        disabled={isAtual}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.selectButtonText,
            isAtual && styles.selectButtonTextAtual,
          ]}
        >
          {isAtual
            ? 'Plano atual'
            : 'Selecionar plano'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ChangePlanScreen({
  route,
  navigation,
}) {
  const planoAtual = route?.params?.planoAtual;

  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscarPlanos = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await findAllByCondition({
        orderBy: 'nivel',
        size: TAMANHO_PAGINA,
      });

      const response = data.response;

      const formatted = response.content.map((e) => ({
        id: e.id,
        nome: `Plano ${e.nome}`,
        descricao: e.descricao,
        valor: e.valor,
        valorOriginal: e.valorOriginal ?? null,
        recomendado: e.recomendado ?? false,
        checkinsPorDia: e.limiteCheckinDia,
        dataContratacao: e.dataContratacao,
        beneficios: e.beneficios,
        nivel: e.nivel,
      }));

      /*
       * Caso o backend não informe nenhum recomendado,
       * usamos o plano intermediário como fallback.
       */
      const algumRecomendadoPeloBackend =
        formatted.some(
          (p) => p.recomendado === true
        );

      if (
        !algumRecomendadoPeloBackend &&
        formatted.length > 2
      ) {
        const ordenadosPorValor = [...formatted].sort(
          (a, b) => a.valor - b.valor
        );

        const idDoMeio =
          ordenadosPorValor[
            Math.floor(ordenadosPorValor.length / 2)
          ].id;

        formatted.forEach((p) => {
          p.recomendado = p.id === idDoMeio;
        });
      } else {
        formatted.forEach((p) => {
          p.recomendado = p.recomendado === true;
        });
      }

      setPlanos(formatted);
    } catch (err) {
      setError(
        err.friendlyMessage ||
          'Não foi possível carregar os planos disponíveis.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarPlanos();
  }, [buscarPlanos]);

  const handleSelecionar = (plano) => {
    navigation.navigate('ReviewPlan', {
      planoAtual,
      planoSelecionado: plano,
    });
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Alterar plano
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Compare os planos disponíveis e escolha o que
          melhor se encaixa no seu uso.
        </Text>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator
              size="small"
              color={colors.blue}
            />
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateBox}>
            <Ionicons
              name="alert-circle-outline"
              size={26}
              color="#DC2626"
            />

            <Text style={styles.stateText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.stateButton}
              onPress={buscarPlanos}
            >
              <Text style={styles.stateButtonText}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading &&
          !error &&
          planos.length === 0 && (
            <View style={styles.stateBox}>
              <Ionicons
                name="albums-outline"
                size={28}
                color={colors.textMuted}
              />

              <Text style={styles.stateText}>
                Nenhum plano disponível no momento.
              </Text>
            </View>
          )}

        {!loading && !error && (
          <View style={styles.plansList}>
            {planos.map((plano) => (
              <PlanCard
                key={plano.id}
                plano={plano}
                isAtual={
                  planoAtual?.id
                    ? plano.id === planoAtual.id
                    : plano.nome === planoAtual?.nome
                }
                onSelect={handleSelecionar}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  intro: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },

  currentPlanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 13,
    marginBottom: 18,
  },

  currentPlanIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  currentPlanContent: {
    flex: 1,
  },

  currentPlanLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },

  currentPlanName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },

  currentPlanPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  currentPlanSuffix: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
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

  plansList: {
    gap: 16,
  },

  planCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    ...shadow,
  },

  planCardAtual: {
    borderColor: colors.blue,
    backgroundColor: '#F7F9FF',
  },

  planCardRecomendado: {
    borderColor: '#F59E0B',
    paddingTop: 34,
  },

  recommendedRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
  },

  recommendedRibbonText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  planCardName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },

  planDescription: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },

  currentTag: {
    backgroundColor: colors.blue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },

  currentTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#fff',
  },

  discountTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },

  discountTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },

  priceRow: {
    marginBottom: 12,
  },

  priceOriginal: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },

  priceValue: {
    fontSize: 13,
    color: colors.textMuted,
  },

  priceValueNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },

  priceValueSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },

  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.chipBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 14,
  },

  checkinText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue,
  },

  beneficiosList: {
    gap: 8,
    marginBottom: 18,
  },

  beneficioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  beneficioText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },

  selectButton: {
    backgroundColor: colors.blue,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectButtonAtual: {
    backgroundColor: colors.chipBg,
  },

  selectButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14.5,
  },

  selectButtonTextAtual: {
    color: colors.blue,
  },
});
