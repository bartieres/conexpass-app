import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../../theme/theme';

const TIPO_META = {
  RECORRENTE: { label: 'Recorrente', color: colors.blue, bg: '#DBEAFE' },
  PACOTE: { label: 'Pacote', color: '#7C3AED', bg: '#EDE9FE' },
  AVULSO: { label: 'Avulso', color: colors.success, bg: colors.successLight },
};
const moeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const condicao = (oferta, label) => oferta?.condicoes?.find(x => x.label?.toLowerCase() === label.toLowerCase())?.valor;

export default function OfertaPagamento({ navigation, oferta, cartao, loading, processando, error, onRetry, onConfirmar }) {
  const meta = TIPO_META[oferta?.tipo?.codigo] || { label: oferta?.tipo?.descricao || 'Oferta', color: colors.textMuted, bg: colors.chipBg };
  const estabelecimento = oferta?.estabelecimento || {};
  const quantidade = condicao(oferta, 'Quantidade de acessos');
  const validade = condicao(oferta, 'Validade dos acessos');
  const modalidades = condicao(oferta, 'Modalidades incluídas');
  const valorValido = oferta?.valor != null && Number.isFinite(Number(oferta.valor)) && Number(oferta.valor) >= 0;
  const podePagar = !!oferta?.id && valorValido && !!cartao?.id && !loading && !processando;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}><Ionicons name="arrow-back" size={22} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text><View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <Text style={styles.sectionLabel}>ESTABELECIMENTO</Text>
        <View style={styles.estabelecimentoRow}>
          {estabelecimento.image ? <Image source={{ uri: estabelecimento.image }} style={styles.estabelecimentoImage} /> :
            <View style={styles.placeholder}><Ionicons name="business-outline" size={27} color={colors.textMuted} /></View>}
          <View style={{ flex: 1 }}>
            <Text style={styles.estabelecimentoNome}>{estabelecimento.name || 'Estabelecimento'}</Text>
            {!!estabelecimento.cidade && <Text style={styles.muted}>{estabelecimento.cidade}</Text>}
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>OFERTA</Text>
        <View style={styles.ofertaCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.ofertaNome}>{oferta?.nome || 'Oferta não identificada'}</Text>
            <View style={[styles.badge, { backgroundColor: meta.bg }]}><Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text></View>
          </View>
          {!!(modalidades || oferta?.descricao) && <Text style={styles.muted}>{modalidades || oferta.descricao}</Text>}
          {!!quantidade && <View style={styles.infoRow}><Ionicons name="ticket-outline" size={17} color={colors.blue} /><Text style={styles.muted}>{quantidade}</Text></View>}
          {!!validade && <View style={styles.infoRow}><Ionicons name="calendar-outline" size={17} color={colors.blue} /><Text style={styles.muted}>{validade}</Text></View>}
          {!!estabelecimento.name && <View style={styles.infoRow}><Ionicons name="location-outline" size={17} color={colors.blue} /><Text style={styles.muted}>Uso apenas em {estabelecimento.name}</Text></View>}
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>FORMA DE PAGAMENTO</Text>
        {loading ? <View style={styles.cartaoCard}><ActivityIndicator color={colors.blue} /><Text style={styles.muted}>Consultando cartão principal...</Text></View> :
          cartao ? <View style={styles.cartaoCard}>
            <View style={styles.rowBetween}><View style={styles.infoRow}><Ionicons name="card-outline" size={22} color={colors.blue} /><Text style={styles.cartaoTitle}>Cartão principal</Text></View><View style={styles.principalBadge}><Text style={styles.principalBadgeText}>Principal</Text></View></View>
            <Text style={styles.cartaoDetalhes}>{cartao.bandeira || 'Cartão'}  •••• {cartao.ultimosDigitos || '••••'}</Text>
          </View> : <View style={styles.cartaoCard}><Text style={styles.cartaoTitle}>Nenhum cartão principal encontrado</Text><Text style={styles.muted}>Cadastre ou defina um cartão principal em Perfil → Formas de pagamento.</Text></View>}
        <View style={styles.avisoCard}><Ionicons name="information-circle" size={21} color={colors.blue} /><Text style={styles.avisoText}>A cobrança será realizada no cartão principal cadastrado. Para utilizar outro cartão, altere o principal em Perfil → Formas de pagamento e retorne a esta tela.</Text></View>
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>RESUMO DO PAGAMENTO</Text>
        <View style={styles.valoresCard}>
          <View style={styles.rowBetween}><Text style={styles.muted}>{oferta?.nome || 'Oferta'}</Text><Text style={styles.valorTexto}>{valorValido ? moeda(oferta.valor) : '—'}</Text></View>
          <View style={styles.valoresDivider} />
          <View style={styles.rowBetween}><Text style={styles.totalLabel}>{oferta?.tipo?.codigo === 'RECORRENTE' ? 'Primeira cobrança' : 'Total da compra'}</Text><Text style={styles.totalValor}>{valorValido ? moeda(oferta.valor) : '—'}</Text></View>
        </View>
        {!!error && <View style={styles.erroCard}><Text style={styles.erroTexto}>{error}</Text>{!cartao && <TouchableOpacity onPress={onRetry}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity>}</View>}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity disabled={!podePagar} style={[styles.ctaButton, !podePagar && styles.disabled]} onPress={onConfirmar} activeOpacity={0.85}>
          {processando ? <ActivityIndicator color="#fff" /> : <><Ionicons name="lock-closed" size={18} color="#fff" /><Text style={styles.ctaText}>Confirmar pagamento</Text></>}
        </TouchableOpacity>
        <View style={styles.secureRow}><Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} /><Text style={styles.secureText}>Pagamento seguro via ConexPass</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backIcon: { padding: 4 }, headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  content: { padding: 20, paddingBottom: 32 }, sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 12 },
  estabelecimentoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  estabelecimentoImage: { width: 70, height: 70, borderRadius: radius.md },
  placeholder: { width: 70, height: 70, borderRadius: radius.md, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  estabelecimentoNome: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 }, muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19, flexShrink: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 22 },
  ofertaCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ofertaNome: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }, badgeText: { fontSize: 11.5, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  cartaoCard: { backgroundColor: '#EFF6FF', borderRadius: radius.md, padding: 16, gap: 12 },
  cartaoTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cartaoDetalhes: { fontSize: 14, color: colors.textMuted, marginLeft: 31 },
  principalBadge: { backgroundColor: '#DBEAFE', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 }, principalBadgeText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  avisoCard: { marginTop: 10, backgroundColor: '#EFF6FF', padding: 14, borderRadius: radius.md, flexDirection: 'row', gap: 10 }, avisoText: { fontSize: 12.5, lineHeight: 19, color: colors.textMuted, flex: 1 },
  valoresCard: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 16 }, valorTexto: { fontSize: 13, color: colors.text, fontWeight: '600' },
  valoresDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 }, totalLabel: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }, totalValor: { fontSize: 21, fontWeight: '800', color: colors.blue },
  erroCard: { marginTop: 14, backgroundColor: '#FEF2F2', padding: 12, borderRadius: radius.md }, erroTexto: { color: '#B91C1C', fontSize: 13 }, retry: { marginTop: 8, fontWeight: '700', color: colors.blue },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#fff' },
  ctaButton: { height: 52, borderRadius: radius.md, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, disabled: { opacity: 0.5 }, ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 }, secureText: { color: colors.textMuted, fontSize: 12 },
});
