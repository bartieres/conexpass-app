import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { colors, shadow } from '../../../../theme/theme';
import { findById } from '../../../../services/assinaturaPagamentoService';
import {
  moeda,
  dataPagamento,
  apresentacaoSituacao,
  iconeOrigem,
} from './paymentPresentation';

function InformationRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.divider]}>
      <View style={styles.smallIcon}>
        <Ionicons name={icon} size={23} color={colors.blue} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PaymentDetail({ route, navigation }) {
  const pagamentoId = route?.params?.pagamentoId ?? route?.params?.cobranca?.id;
  const [pagamento, setPagamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [abrindoComprovante, setAbrindoComprovante] = useState(false);
  const versaoRef = useRef(0);
  const focoRef = useRef(false);
  const carregandoRef = useRef(false);
  const comprovanteRef = useRef(false);

  const buscarPagamento = useCallback(
    async ({ refresh = false } = {}) => {
      if (!focoRef.current || carregandoRef.current) return;
      if (pagamentoId == null) {
        setError(
          'Não foi possível identificar o pagamento. Volte ao histórico e selecione uma cobrança.'
        );
        setLoading(false);
        return;
      }
      const versao = ++versaoRef.current;
      carregandoRef.current = true;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const { response } = await findById(pagamentoId);
        if (focoRef.current && versao === versaoRef.current)
          setPagamento(response);
      } catch (err) {
        if (focoRef.current && versao === versaoRef.current)
          setError(
            err.friendlyMessage ||
              err.message ||
              'Não foi possível carregar o pagamento.'
          );
      } finally {
        if (focoRef.current && versao === versaoRef.current) {
          carregandoRef.current = false;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [pagamentoId]
  );

  useFocusEffect(
    useCallback(() => {
      focoRef.current = true;
      carregandoRef.current = false;
      setPagamento(null);
      setCopiado(false);
      buscarPagamento();
      return () => {
        focoRef.current = false;
        ++versaoRef.current;
        carregandoRef.current = false;
      };
    }, [buscarPagamento])
  );

  const copiarCodigo = async () => {
    if (!pagamento?.codigo) return;
    try {
      await Clipboard.setStringAsync(pagamento.codigo);
      if (focoRef.current) setCopiado(true);
    } catch {
      Alert.alert('Não foi possível copiar', 'Tente novamente em instantes.');
    }
  };
  const abrirComprovante = async () => {
    if (comprovanteRef.current || !pagamento?.comprovanteUrl) return;
    comprovanteRef.current = true;
    setAbrindoComprovante(true);
    try {
      if (!/^https?:\/\/[^\s]+$/i.test(pagamento.comprovanteUrl))
        throw new Error('URL inválida');
      await Linking.openURL(pagamento.comprovanteUrl);
    } catch {
      Alert.alert(
        'Não foi possível abrir o comprovante',
        'Tente novamente em instantes.'
      );
    } finally {
      comprovanteRef.current = false;
      if (focoRef.current) setAbrindoComprovante(false);
    }
  };
  const status = apresentacaoSituacao(pagamento?.situacao);
  const forma = pagamento?.formaPagamento?.cartao;
  const desconto = pagamento?.desconto;

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
        <Text style={styles.headerTitle}>Detalhes do pagamento</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => buscarPagamento({ refresh: true })}
            colors={[colors.blue]}
            tintColor={colors.blue}
          />
        }
      >
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.stateText}>Carregando pagamento...</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={28} color="#C51F32" />
            <Text style={styles.stateText}>{error}</Text>
            {pagamentoId != null && (
              <TouchableOpacity
                style={styles.retry}
                onPress={() => buscarPagamento()}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!loading && pagamento && (
          <>
            <LinearGradient
              colors={['#FFFFFF', '#F5F8FF', '#DFE9FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summary}
            >
              <View style={styles.largeIcon}>
                <Ionicons
                  name={iconeOrigem(pagamento.origemDescricao)}
                  size={36}
                  color={colors.blue}
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{pagamento.nome || 'Pagamento'}</Text>
                <Text style={styles.origin}>
                  {pagamento.origemDescricao || '—'}
                </Text>
                <View style={[styles.pill, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon} size={18} color={status.color} />
                  <Text style={[styles.pillText, { color: status.color }]}>
                    {status.detail}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            <Text style={styles.sectionTitle}>Identificação da cobrança</Text>
            <View style={styles.codeCard}>
              <View style={styles.smallIcon}>
                <Text style={styles.hash}>#</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.infoValue}>Código da cobrança</Text>
                <Text style={styles.code} selectable>
                  {pagamento.codigo || '—'}
                </Text>
              </View>
              {!!pagamento.codigo && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copiarCodigo}
                  accessibilityRole="button"
                  accessibilityLabel="Copiar código da cobrança"
                >
                  <Ionicons
                    name={copiado ? 'checkmark-outline' : 'copy-outline'}
                    size={20}
                    color={colors.blue}
                  />
                  <Text
                    style={styles.copyText}
                    accessibilityLiveRegion="polite"
                  >
                    {copiado ? 'Copiado' : 'Copiar'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sectionTitle}>Informações do pagamento</Text>
            <View style={styles.card}>
              <InformationRow
                icon="calendar-outline"
                label="Data da cobrança"
                value={dataPagamento(pagamento.dataCobranca, true)}
              />
              <InformationRow
                icon="calendar-outline"
                label="Data do pagamento"
                value={
                  pagamento.dataPagamento
                    ? dataPagamento(pagamento.dataPagamento)
                    : 'Não informada'
                }
                last
              />
            </View>
            <Text style={styles.sectionTitle}>Valores</Text>
            <View style={styles.valuesCard}>
              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>Valor original</Text>
                <Text style={styles.valueAmount}>
                  {moeda(pagamento.valorOriginal)}
                </Text>
              </View>
              {Number.isFinite(Number(desconto)) && Number(desconto) > 0 && (
                <View style={styles.valueRow}>
                  <Text style={styles.valueLabel}>Desconto</Text>
                  <Text style={styles.discount}>
                    - {moeda(Number(desconto))}
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.total}>Valor final</Text>
                <Text style={styles.total}>{moeda(pagamento.valorFinal)}</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Forma de pagamento</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.smallIcon}>
                  <Ionicons name="card-outline" size={25} color={colors.blue} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.infoLabel}>
                    {forma?.tipo === 'CREDIT_CARD'
                      ? 'Cartão de crédito'
                      : 'Forma de pagamento'}
                  </Text>
                  <Text style={styles.infoValue}>
                    {forma
                      ? [
                          forma.bandeira,
                          forma.ultimosDigitos
                            ? `•••• ${forma.ultimosDigitos}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Dados não informados'
                      : 'Não informada para esta cobrança'}
                  </Text>
                </View>
              </View>
            </View>
            {!!pagamento.comprovanteUrl && (
              <TouchableOpacity
                style={styles.receiptButton}
                onPress={abrirComprovante}
                disabled={abrindoComprovante}
                accessibilityRole="button"
              >
                {abrindoComprovante ? (
                  <ActivityIndicator color={colors.blue} />
                ) : (
                  <Ionicons
                    name="download-outline"
                    size={22}
                    color={colors.blue}
                  />
                )}
                <Text style={styles.receiptText}>Ver comprovante</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff', flex: 1 },
  body: { padding: 16, paddingTop: 22, paddingBottom: 32 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6EDFB',
    ...shadow,
  },
  largeIcon: {
    width: 66,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#E4EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  name: { fontSize: 21, fontWeight: '800', color: colors.text },
  origin: { fontSize: 13, color: '#596784', marginTop: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 12,
  },
  pillText: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 26,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    ...shadow,
  },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow,
  },
  smallIcon: {
    width: 44,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#EBF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hash: { color: colors.blue, fontSize: 27, fontWeight: '800' },
  code: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 6 },
  copyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#F5F8FF',
  },
  copyText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  infoValue: { fontSize: 13, lineHeight: 20, color: '#596784', marginTop: 5 },
  valuesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    ...shadow,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  valueLabel: { flex: 1, fontSize: 14, color: colors.text },
  valueAmount: { fontSize: 14, color: colors.text },
  discount: { color: '#18752B', fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#EAF1FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
  },
  total: { color: colors.blue, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  receiptButton: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 99,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    padding: 12,
  },
  receiptText: { fontSize: 15, fontWeight: '700', color: colors.blue },
  stateBox: {
    alignItems: 'center',
    gap: 12,
    padding: 26,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
  },
  stateText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retry: { padding: 12, backgroundColor: colors.chipBg, borderRadius: 12 },
  retryText: { color: colors.blue, fontWeight: '700' },
});
