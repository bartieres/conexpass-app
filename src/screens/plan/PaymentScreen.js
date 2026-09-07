import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';
import { getResumo } from '../../services/pagamentoService';

const TAMANHO_PAGINA = 15;

function formatarMoeda(valor) {
  if (valor == null) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function StatusPill({ status }) {
  const pago = status === 'PAGO';
  return (
    <View style={[styles.statusPill, pago ? styles.statusPillOk : styles.statusPillError]}>
      <Text style={[styles.statusPillText, pago ? styles.statusPillTextOk : styles.statusPillTextError]}>
        {pago ? 'Pago' : 'Falhou'}
      </Text>
    </View>
  );
}

function ChargeRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.chargeRow} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.chargeDate}>{formatarData(item.data)}</Text>
        <Text style={styles.chargeValue}>{formatarMoeda(item.valor)}</Text>
      </View>
      <StatusPill status={item.status} />
      <Ionicons name="chevron-forward" size={16} color={colors.textLight} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}

export default function PaymentScreen({ navigation }) {
  const [resumo, setResumo] = useState(null);
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [resumoError, setResumoError] = useState('');

  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [pagina, setPagina] = useState(0);

  const buscarResumo = useCallback(async () => {
    setLoadingResumo(true);
    setResumoError('');
    try {
      // TODO: confirmar endpoint/formato exato no backend
      const data = await getResumo();
      setResumo(data);
    } catch (err) {
      setResumoError(err.friendlyMessage || 'Não foi possível carregar o status do pagamento.');
    } finally {
      setLoadingResumo(false);
    }
  }, []);

  const buscarCobrancas = useCallback(
    async ({ reset = true, isRefresh = false } = {}) => {
      if (!reset && loadingMore) return;
      const paginaAtual = reset ? 0 : pagina + 1;

      if (reset) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
        const data = await pagamentoService.findAllByCondition({ page: paginaAtual, size: TAMANHO_PAGINA });
        const { content, last } = data.response;

        setPagina(paginaAtual);
        setHasMore(last === false);
        setCobrancas((atual) => (reset ? content : [...atual, ...content]));
      } catch (err) {
        setError(err.friendlyMessage || 'Não foi possível carregar o histórico de pagamentos.');
      } finally {
        if (reset) {
          isRefresh ? setRefreshing(false) : setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [loadingMore, pagina]
  );

  useEffect(() => {
    buscarResumo();
    buscarCobrancas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    buscarResumo();
    buscarCobrancas({ reset: true, isRefresh: true });
  };

  const handleLoadMore = () => {
    if (hasMore) buscarCobrancas({ reset: false });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamentos</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={cobrancas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.blue]} tintColor={colors.blue} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            {loadingResumo && (
              <View style={[styles.card, styles.stateBoxInline]}>
                <ActivityIndicator size="small" color={colors.blue} />
              </View>
            )}

            {!loadingResumo && !!resumoError && (
              <View style={[styles.card, styles.stateBoxInline]}>
                <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
                <Text style={styles.stateText}>{resumoError}</Text>
              </View>
            )}

            {!loadingResumo && !resumoError && resumo && (
              <View style={styles.card}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, !resumo.emDia && styles.statusDotError]} />
                  <Text style={styles.statusText}>
                    {resumo.emDia ? 'Pagamento em dia' : 'Pagamento pendente'}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                <Text style={styles.cardLabel}>Próxima cobrança</Text>
                <Text style={styles.nextChargeDate}>{formatarData(resumo.proximaCobranca?.data)}</Text>
                <Text style={styles.nextChargeValue}>{formatarMoeda(resumo.proximaCobranca?.valor)}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Histórico de pagamentos</Text>

            {loading && (
              <View style={styles.stateBox}>
                <ActivityIndicator size="small" color={colors.blue} />
                <Text style={styles.stateText}>Carregando pagamentos...</Text>
              </View>
            )}

            {!loading && !!error && (
              <View style={styles.stateBox}>
                <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
                <Text style={styles.stateText}>{error}</Text>
                <TouchableOpacity style={styles.stateButton} onPress={() => buscarCobrancas({ reset: true })}>
                  <Text style={styles.stateButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) =>
          !loading && !error ? (
            <ChargeRow item={item} onPress={(cobranca) => navigation.navigate('PaymentDetail', { cobranca })} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={32} color={colors.textLight} />
              <Text style={styles.emptyText}>Nenhum pagamento registrado ainda</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreBox}>
              <ActivityIndicator size="small" color={colors.blue} />
            </View>
          ) : null
        }
      />
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

  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, marginBottom: 20, ...shadow },
  stateBoxInline: { alignItems: 'center', gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.success },
  statusDotError: { backgroundColor: '#DC2626' },
  statusText: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  cardDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  cardLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  nextChargeDate: { fontSize: 15, fontWeight: '700', color: colors.text },
  nextChargeValue: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },

  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 30 },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    ...shadow,
  },
  chargeDate: { fontSize: 13, color: colors.textMuted },
  chargeValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusPillOk: { backgroundColor: colors.successLight },
  statusPillError: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 11.5, fontWeight: '700' },
  statusPillTextOk: { color: colors.success },
  statusPillTextError: { color: '#DC2626' },

  loadingMoreBox: { paddingVertical: 16, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 30, gap: 10 },
  emptyText: { color: colors.textLight, fontSize: 13 },
});
