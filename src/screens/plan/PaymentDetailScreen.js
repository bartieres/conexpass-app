import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';

function formatarMoeda(valor) {
  if (valor == null) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function DetailRow({ label, value, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function PaymentDetailScreen({ route, navigation }) {
  const cobranca = route?.params?.cobranca || {};
  const pago = cobranca.status === 'PAGO';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da cobrança</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.summaryCard}>
          <View style={[styles.statusIconWrap, !pago && styles.statusIconWrapError]}>
            <Ionicons
              name={pago ? 'checkmark-circle' : 'close-circle'}
              size={26}
              color={pago ? colors.success : '#DC2626'}
            />
          </View>
          <Text style={styles.summaryValue}>{formatarMoeda(cobranca.valor)}</Text>
          <Text style={styles.summaryStatus}>{pago ? 'Pagamento confirmado' : 'Pagamento não realizado'}</Text>
        </View>

        <View style={styles.card}>
          <DetailRow label="Data" value={formatarData(cobranca.data)} />
          <DetailRow label="Valor" value={formatarMoeda(cobranca.valor)} />
          <DetailRow label="Plano" value={cobranca.plano || '—'} />
          <DetailRow label="Forma de pagamento" value={cobranca.formaPagamento || '—'} />
          <DetailRow label="Status" value={pago ? 'Pago' : 'Falhou'} />
          <DetailRow label="Identificador" value={cobranca.transacaoId || '—'} isLast />
        </View>

        {/* TODO: quando houver emissão de comprovante no backend, reativar botão abaixo */}
        {/* <TouchableOpacity style={styles.receiptButton}>
          <Ionicons name="document-text-outline" size={16} color={colors.blue} />
          <Text style={styles.receiptButtonText}>Ver comprovante</Text>
        </TouchableOpacity> */}
      </ScrollView>
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

  summaryCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 16 },
  statusIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statusIconWrapError: { backgroundColor: '#FEE2E2' },
  summaryValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  summaryStatus: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, ...shadow },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 13.5, fontWeight: '700', color: colors.text },

  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.chipBg,
    height: 48,
    borderRadius: radius.md,
    marginTop: 16,
  },
  receiptButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },
});
