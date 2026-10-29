import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../../theme/theme';

const moeda = (valor) => valor == null ? '—' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS = {
  CONFIRMADO: { icon: 'checkmark-circle', color: '#16A34A', bg: '#DCFCE7', titulo: 'Pagamento confirmado!', mensagem: 'Sua contratação foi confirmada. O acesso ficará disponível em suas contratações.' },
  PENDENTE: { icon: 'time-outline', color: '#D97706', bg: '#FEF3C7', titulo: 'Aguardando confirmação', mensagem: 'Recebemos sua solicitação. O acesso será liberado quando o pagamento for confirmado.' },
  RECUSADO: { icon: 'close-circle', color: '#DC2626', bg: '#FEE2E2', titulo: 'Pagamento não aprovado', mensagem: 'Não foi possível aprovar o pagamento. Confira seu cartão principal e consulte a situação da cobrança antes de tentar novamente.' },
};

export default function OfertaPagamentoResultado({ navigation, oferta, status, loading, error, onAtualizar }) {
  const estado = STATUS[status] || STATUS.PENDENTE;
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Resultado do pagamento</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconBg, { backgroundColor: estado.bg }]}><Ionicons name={estado.icon} size={58} color={estado.color} /></View>
        <Text style={styles.titulo}>{estado.titulo}</Text>
        <Text style={styles.mensagem}>{estado.mensagem}</Text>
        <View style={styles.resumoCard}>
          <Text style={styles.sectionLabel}>RESUMO DA CONTRATAÇÃO</Text>
          <View style={styles.item}><Text style={styles.label}>Estabelecimento</Text><Text style={styles.valor}>{oferta?.estabelecimento?.name || '—'}</Text></View>
          <View style={styles.item}><Text style={styles.label}>Oferta</Text><Text style={styles.valor}>{oferta?.nome || '—'}</Text></View>
          <View style={[styles.item, styles.ultimo]}><Text style={styles.label}>Valor</Text><Text style={styles.valorDestaque}>{moeda(oferta?.valor)}</Text></View>
        </View>
        {loading && <ActivityIndicator style={{ marginTop: 16 }} color={colors.blue} />}
        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
      <View style={styles.footer}>
        {status !== 'CONFIRMADO' && <TouchableOpacity style={styles.secondaryButton} onPress={onAtualizar} disabled={loading}><Ionicons name="refresh-outline" size={17} color={colors.blue} /><Text style={styles.secondaryText}>Atualizar situação</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.popToTop()}><Text style={styles.primaryText}>Voltar para Explorar</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, header: { paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }, headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  content: { padding: 22, alignItems: 'center', paddingBottom: 40 },
  iconBg: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 22 },
  titulo: { fontSize: 23, fontWeight: '800', color: colors.text, textAlign: 'center' },
  mensagem: { marginTop: 12, fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
  resumoCard: { marginTop: 32, borderRadius: radius.md, backgroundColor: colors.bg, padding: 18, width: '100%' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  ultimo: { borderBottomWidth: 0 }, label: { fontSize: 13, color: colors.textMuted }, valor: { fontSize: 13, color: colors.text, fontWeight: '700', textAlign: 'right', flex: 1 }, valorDestaque: { fontSize: 18, fontWeight: '800', color: colors.blue },
  error: { marginTop: 16, fontSize: 13, textAlign: 'center', color: '#B91C1C' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  primaryButton: { backgroundColor: colors.blue, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: colors.blue, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, secondaryText: { color: colors.blue, fontSize: 14, fontWeight: '700' },
});
