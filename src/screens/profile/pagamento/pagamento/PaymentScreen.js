import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../../../../theme/theme';
import { findAllByCondition } from '../../../../services/assinaturaPagamentoService';
import {
  moeda,
  dataPagamento,
  apresentacaoSituacao,
  iconeOrigem,
} from './paymentPresentation';

const TAMANHO_PAGINA = 10;

function PaymentRow({ item, first, last, onPress }) {
  const status = apresentacaoSituacao(item.situacao);
  return (
    <TouchableOpacity
      style={[styles.row, first && styles.firstRow, last && styles.lastRow]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver pagamento ${item.nome}, ${moeda(item.valor)}, ${status.label}`}
      activeOpacity={0.75}
    >
      <View style={styles.originIcon}>
        <Ionicons
          name={iconeOrigem(item.origemDescricao)}
          size={26}
          color={colors.blue}
        />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.name} numberOfLines={2}>
          {item.nome || 'Pagamento'}
        </Text>
        <Text style={styles.origin}>{item.origemDescricao || '—'}</Text>
        <Text style={styles.code}>
          {item.codigo || '—'} • {dataPagamento(item.dataCobranca)}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={styles.amount}>{moeda(item.valor)}</Text>
        <View style={[styles.pill, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.pillText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

export default function PaymentScreen({ navigation }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const paginaRef = useRef(0);
  const ultimaRef = useRef(true);
  const requisicaoRef = useRef(0);
  const carregandoRef = useRef(false);
  const focoRef = useRef(false);
  const tentativaRef = useRef({ reset: true });

  const buscarPagamentos = useCallback(
    async ({ reset = true, refresh = false } = {}) => {
      if (
        !focoRef.current ||
        carregandoRef.current ||
        (!reset && ultimaRef.current)
      )
        return;
      const versao = ++requisicaoRef.current;
      const pagina = reset ? 0 : paginaRef.current + 1;
      carregandoRef.current = true;
      if (reset) {
        if (refresh) setRefreshing(true);
        else setLoading(true);
      } else setLoadingMore(true);
      setError('');
      try {
        const { response } = await findAllByCondition({
          page: pagina,
          size: TAMANHO_PAGINA,
        });
        if (!focoRef.current || versao !== requisicaoRef.current) return;
        // response.page é baseado em 1; o próximo request usa nosso contador em 0.
        paginaRef.current = pagina;
        ultimaRef.current = response.last;
        setPagamentos((atuais) =>
          reset
            ? response.content
            : [
                ...atuais,
                ...response.content.filter(
                  (item) => !atuais.some((atual) => atual.id === item.id)
                ),
              ]
        );
      } catch (err) {
        if (focoRef.current && versao === requisicaoRef.current) {
          tentativaRef.current = { reset, refresh };
          setError(
            err.friendlyMessage ||
              err.message ||
              'Não foi possível carregar seus pagamentos.'
          );
        }
      } finally {
        if (focoRef.current && versao === requisicaoRef.current) {
          carregandoRef.current = false;
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      focoRef.current = true;
      carregandoRef.current = false;
      buscarPagamentos();
      return () => {
        focoRef.current = false;
        ++requisicaoRef.current;
        carregandoRef.current = false;
      };
    }, [buscarPagamentos])
  );

  const errorBox = error ? (
    <View style={styles.stateBox}>
      <Ionicons name="alert-circle-outline" size={26} color="#C51F32" />
      <Text style={styles.stateText}>{error}</Text>
      <TouchableOpacity
        style={styles.retry}
        onPress={() => buscarPagamentos(tentativaRef.current)}
        accessibilityRole="button"
      >
        <Text style={styles.retryText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  ) : null;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Pagamentos</Text>
        <View style={{ width: 42 }} />
      </View>
      <FlatList
        data={pagamentos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => buscarPagamentos({ refresh: true })}
            colors={[colors.blue]}
            tintColor={colors.blue}
          />
        }
        ListHeaderComponent={
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="receipt-outline" size={28} color={colors.blue} />
            </View>
            <Text style={styles.introText}>
              Acompanhe o histórico de todas as suas cobranças de planos e
              ofertas.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <PaymentRow
            item={item}
            first={index === 0}
            last={index === pagamentos.length - 1}
            onPress={() =>
              navigation.navigate('PaymentDetail', { pagamentoId: item.id })
            }
          />
        )}
        onEndReached={() => {
          if (!error) buscarPagamentos({ reset: false });
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.blue} />
              <Text style={styles.stateText}>Carregando pagamentos...</Text>
            </View>
          ) : (
            errorBox || (
              <View style={styles.stateBox}>
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={colors.blue}
                />
                <Text style={styles.emptyTitle}>Seu histórico começa aqui</Text>
                <Text style={styles.stateText}>
                  Nenhum pagamento registrado no momento.
                </Text>
              </View>
            )
          )
        }
        ListFooterComponent={
          <>
            {loadingMore && (
              <ActivityIndicator style={{ margin: 20 }} color={colors.blue} />
            )}
            {pagamentos.length > 0 && errorBox}
          </>
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
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, flexShrink: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D8E4FF',
    backgroundColor: '#F2F6FF',
    marginBottom: 24,
  },
  introIcon: {
    width: 52,
    height: 56,
    borderRadius: 17,
    backgroundColor: '#E2ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 19,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  firstRow: { borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  lastRow: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderBottomWidth: 0,
  },
  originIcon: {
    width: 46,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 5 },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  origin: { fontSize: 12, color: '#596784', lineHeight: 17 },
  code: { fontSize: 11, color: '#596784', lineHeight: 16 },
  amountColumn: { alignItems: 'flex-end', gap: 8, maxWidth: '31%' },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },
  pillText: { fontSize: 10, fontWeight: '700', flexShrink: 1 },
  stateBox: {
    alignItems: 'center',
    gap: 12,
    padding: 26,
    backgroundColor: '#fff',
    borderRadius: 22,
    marginTop: 12,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  retry: { backgroundColor: colors.chipBg, borderRadius: 12, padding: 12 },
  retryText: { color: colors.blue, fontSize: 13, fontWeight: '700' },
});
