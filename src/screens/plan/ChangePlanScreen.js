import { useState, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow } from '../../theme/theme';
import { findAllByCondition } from '../../services/planoService';

const TAMANHO_PAGINA = 50;
const PLAN_COLORS = [
  ['#E3EEFF', '#EFF5FF'],
  ['#E0F4EC', '#F0FAF6'],
  ['#EEE7FF', '#F7F3FF'],
  ['#FFF0DC', '#FFF8ED'],
];

function formatarMoeda(valor) {
  if (valor == null) return '';

  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function calcularDesconto(valorOriginal, valor) {
  if (!valorOriginal || valorOriginal <= valor) return null;

  return Math.round((1 - valor / valorOriginal) * 100);
}

function PlanCard({ plano, isAtual, onSelect, width, index }) {
  const desconto = calcularDesconto(plano.valorOriginal, plano.valor);

  const destacarComoRecomendado = plano.recomendado && !isAtual;

  return (
    <View
      style={[
        styles.planCard,
        { width },
        isAtual && styles.planCardAtual,
        destacarComoRecomendado && styles.planCardRecomendado,
      ]}
    >
      <LinearGradient
        colors={PLAN_COLORS[index % PLAN_COLORS.length]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardAccent}
      >
        <View style={styles.planIcon}>
          <Ionicons name="fitness-outline" size={25} color={colors.blueDark} />
        </View>
        <Text style={styles.cardBrand}>PLANO CONEXPASS</Text>
      </LinearGradient>
      <View style={styles.cardBody}>
        {destacarComoRecomendado && (
          <View style={styles.recommendedRibbon}>
            <Ionicons name="star" size={12} color="#fff" />

            <Text style={styles.recommendedRibbonText}>Recomendado</Text>
          </View>
        )}

        <View style={styles.planCardHeader}>
          <Text style={styles.planCardName}>{plano.nome}</Text>

          {isAtual && (
            <View style={styles.currentTag}>
              <Text style={styles.currentTagText}>Seu plano atual</Text>
            </View>
          )}

          {!isAtual && !!desconto && (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>-{desconto}%</Text>
            </View>
          )}
        </View>

        {!!plano.descricao && (
          <Text style={styles.planDescription}>{plano.descricao}</Text>
        )}

        <View style={styles.priceRow}>
          {!!plano.valorOriginal && plano.valorOriginal > plano.valor && (
            <Text style={styles.priceOriginal}>
              de {formatarMoeda(plano.valorOriginal)}
            </Text>
          )}

          <Text style={styles.priceValue}>
            {!!plano.valorOriginal && plano.valorOriginal > plano.valor
              ? 'por '
              : ''}

            <Text style={styles.priceValueNumber}>
              {formatarMoeda(plano.valor)}
            </Text>

            <Text style={styles.priceValueSuffix}>/mês</Text>
          </Text>
        </View>

        <View style={styles.checkinRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.blue} />

          <Text style={styles.checkinText}>
            {plano.checkinsPorDia}x check-in por dia
          </Text>
        </View>

        {!!plano.beneficios?.length && (
          <View style={styles.beneficiosList}>
            {plano.beneficios.map((beneficio) => (
              <View key={beneficio} style={styles.beneficioRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />

                <Text style={styles.beneficioText}>{beneficio}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.selectButton, isAtual && styles.selectButtonAtual]}
          onPress={() => onSelect(plano)}
          disabled={isAtual}
          accessibilityRole="button"
          accessibilityLabel={`${isAtual ? 'Plano atual' : 'Selecionar'}: ${plano.nome}`}
          accessibilityState={{ disabled: isAtual }}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.selectButtonText,
              isAtual && styles.selectButtonTextAtual,
            ]}
          >
            {isAtual ? 'Plano atual' : 'Selecionar plano'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePlanScreen({ route, navigation }) {
  const planoAtual = route?.params?.planoAtual;
  const modo =
    route?.params?.modo || (planoAtual ? 'ALTERAR_ATUAL' : 'ESCOLHER');
  const agendamento = ['AGENDAR_PROXIMO', 'ALTERAR_PROXIMO'].includes(modo);
  const planoReferencia =
    modo === 'ALTERAR_PROXIMO'
      ? route?.params?.planoAgendado
      : agendamento
        ? null
        : planoAtual;
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 56, 360);
  const [planoVisivel, setPlanoVisivel] = useState(0);

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
      const algumRecomendadoPeloBackend = formatted.some(
        (p) => p.recomendado === true
      );

      if (!algumRecomendadoPeloBackend && formatted.length > 2) {
        const ordenadosPorValor = [...formatted].sort(
          (a, b) => a.valor - b.valor
        );

        const idDoMeio =
          ordenadosPorValor[Math.floor(ordenadosPorValor.length / 2)].id;

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
    // Carregamento inicial dos planos disponíveis.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarPlanos();
  }, [buscarPlanos]);

  const handleSelecionar = (plano) => {
    navigation.navigate('ReviewPlan', {
      ...route.params,
      modo,
      planoAtual,
      planoSelecionado: plano,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {agendamento
            ? 'Próximo plano'
            : planoAtual
              ? 'Alterar plano'
              : 'Escolher plano'}
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <Image
            source={require('../../assets/logo-conexpass.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Planos ConexPass"
          />
          <Text style={styles.introTitle}>
            Seu próximo passo{'\n'}começa aqui.
          </Text>
          <Text style={styles.intro}>
            Compare os planos e encontre o que combina com o seu ritmo.
          </Text>
          {agendamento && (
            <Text style={styles.intro}>
              Escolha o próximo plano. Não há cobrança hoje; o início será
              definido pela API e o acesso dependerá da confirmação do
              pagamento.
            </Text>
          )}
          <View style={styles.swipeHint}>
            <Ionicons
              name="swap-horizontal-outline"
              size={18}
              color={colors.blue}
            />
            <Text style={styles.swipeHintText}>
              Deslize para conhecer as opções
            </Text>
          </View>
        </View>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />

            <Text style={styles.stateText}>{error}</Text>

            <TouchableOpacity style={styles.stateButton} onPress={buscarPlanos}>
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && planos.length === 0 && (
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

        {!loading && !error && planos.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plansList}
              snapToInterval={cardWidth + 16}
              decelerationRate="fast"
              disableIntervalMomentum
              onScroll={(event) => {
                const indice = Math.round(
                  event.nativeEvent.contentOffset.x / (cardWidth + 16)
                );
                setPlanoVisivel(
                  Math.max(0, Math.min(indice, planos.length - 1))
                );
              }}
              scrollEventThrottle={32}
            >
              {planos.map((plano, index) => (
                <PlanCard
                  key={plano.id}
                  plano={plano}
                  index={index}
                  width={cardWidth}
                  isAtual={
                    planoReferencia?.id
                      ? plano.id === planoReferencia.id
                      : plano.nome === planoReferencia?.nome
                  }
                  onSelect={handleSelecionar}
                />
              ))}
            </ScrollView>
            <View
              style={styles.pagination}
              accessibilityLabel={`Plano ${planoVisivel + 1} de ${planos.length}`}
            >
              {planos.map((plano, index) => (
                <View
                  key={plano.id}
                  style={[
                    styles.pageDot,
                    index === planoVisivel && styles.pageDotActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.pageCount}>
              {planoVisivel + 1} de {planos.length} planos
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  introBlock: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  logo: { width: 164, height: 34, marginBottom: 22 },
  introTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swipeHintText: { fontSize: 12, fontWeight: '600', color: colors.blue },
  cardAccent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.blueDark,
  },
  cardBody: { padding: 22, flexGrow: 1 },
  pagination: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  pageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#CFD8E8' },
  pageDotActive: { width: 22, backgroundColor: colors.blue },
  pageCount: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
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
    paddingTop: 4,
    paddingBottom: 32,
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'stretch',
  },

  planCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
    ...shadow,
  },

  planCardAtual: {
    borderColor: colors.blue,
    backgroundColor: '#fff',
  },

  planCardRecomendado: {
    borderColor: '#8DCAB0',
  },

  recommendedRibbon: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#287954',
    paddingVertical: 6,
  },

  recommendedRibbonText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  planCardHeader: {
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  planCardName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
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
    flexGrow: 1,
    gap: 12,
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
    marginTop: 'auto',
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
