import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../../theme/theme';

const IMAGEM_PADRAO = require('../../../assets/image-academia.jpeg');

const TIPO_META = {
  RECORRENTE: { label: 'Recorrente', color: colors.blue, bg: '#DBEAFE', icon: 'sync-outline', totalLabel: 'Total da primeira cobrança' },
  PACOTE: { label: 'Pacote', color: '#7C3AED', bg: '#EDE9FE', icon: 'layers-outline', totalLabel: 'Total da compra' },
  AVULSO: { label: 'Avulso', color: colors.success, bg: colors.successLight, icon: 'flash-outline', totalLabel: 'Total da compra' },
};

function moeda(valor) {
  if (valor == null || valor === '' || !Number.isFinite(Number(valor))) return '—';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcularValores(resumo) {
  const original = resumo?.valor == null || resumo.valor === '' ? NaN : Number(resumo.valor);
  const promocional = resumo?.valorPromocional == null || resumo.valorPromocional === '' ? NaN : Number(resumo.valorPromocional);
  const valido = Number.isFinite(original) && original >= 0;
  const temDesconto = valido && Number.isFinite(promocional) && promocional >= 0 && promocional < original;
  return {
    valorOriginal: valido ? original : null,
    valorFinal: valido ? (temDesconto ? promocional : original) : null,
    temDesconto,
    desconto: temDesconto ? Math.round((original - promocional) / original * 100) : null,
  };
}

function InfoRow({ icon, children }) {
  if (children == null || children === '') return null;
  return <View style={styles.infoRow}><Ionicons name={icon} size={18} color={colors.blue} /><Text style={styles.infoText}>{children}</Text></View>;
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function OfertaCheckout({
  navigation,
  resumo,
  cartao,
  loadingCartao,
  cartaoError,
  processando,
  pagamentoError,
  onRetryCartao,
  onConfirmar,
  podeConfirmar,
}) {
  if (!resumo) return null;

  const meta = TIPO_META[resumo.tipo?.codigo] || {
    label: resumo.tipo?.descricao || 'Oferta', color: colors.textMuted,
    bg: colors.chipBg, icon: 'pricetag-outline', totalLabel: 'Total da compra',
  };
  const estabelecimento = resumo.estabelecimento || {};
  const nome = estabelecimento.name || estabelecimento.nomeFantasia || estabelecimento.razaoSocial || 'Estabelecimento';
  const categoria = estabelecimento.categoria || estabelecimento.tipo?.descricao;
  const cidade = estabelecimento.cidade || estabelecimento.endereco?.cidade?.nome;
  const uf = estabelecimento.uf || estabelecimento.endereco?.cidade?.estado?.uf;
  const localizacao = [cidade, uf].filter(Boolean).join(' - ');
  const subtitulo = [categoria, localizacao].filter(Boolean).join(' • ');
  const { valorOriginal, valorFinal, temDesconto, desconto } = calcularValores(resumo);
  const habilitado = podeConfirmar && !processando;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={25} color={colors.blue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumo da contratação</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
        <SectionLabel>ESTABELECIMENTO</SectionLabel>
        <View style={styles.estabelecimentoRow}>
          <Image source={IMAGEM_PADRAO} style={styles.estabelecimentoImage} resizeMode="cover" />
          <View style={styles.estabelecimentoInfo}>
            <Text style={styles.estabelecimentoNome} numberOfLines={2}>{nome}</Text>
            {!!subtitulo && <Text style={styles.estabelecimentoLocal} numberOfLines={2}>{subtitulo}</Text>}
          </View>
        </View>

        <View style={styles.divider} />
        <SectionLabel>OFERTA SELECIONADA</SectionLabel>
        <View style={styles.ofertaCard}>
          <View style={styles.ofertaHeader}>
            <Text style={styles.ofertaNome}>{resumo.nome}</Text>
            <View style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={14} color={meta.color} />
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          {!!(resumo.modalidades || resumo.descricao) && <Text style={styles.ofertaDescricao}>{resumo.modalidades || resumo.descricao}</Text>}
          {!!resumo.quantidadeAcessos && <InfoRow icon="ticket-outline">{resumo.quantidadeAcessos}</InfoRow>}
          {!!resumo.validade && <InfoRow icon="calendar-outline">{resumo.validade}</InfoRow>}
          {!!resumo.cobranca && resumo.recorrente && <InfoRow icon="repeat-outline">Cobrança: {resumo.cobranca}</InfoRow>}
          <InfoRow icon="business-outline">Uso apenas em {nome}</InfoRow>
        </View>

        <View style={styles.divider} />
        <SectionLabel>RESUMO DOS VALORES</SectionLabel>
        <View style={styles.valoresCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.valorItemLabel}>{resumo.nome}</Text>
            <View style={styles.valorItemValores}>
              {temDesconto && <Text style={styles.valorOriginal}>{moeda(valorOriginal)}</Text>}
              <Text style={styles.valorTexto}>{moeda(valorFinal)}</Text>
            </View>
          </View>
          {temDesconto && (
            <View style={styles.descontoRow}>
              <Text style={styles.muted}>Desconto</Text>
              <View style={styles.descontoBadge}><Text style={styles.descontoBadgeText}>-{desconto}%</Text></View>
            </View>
          )}
          <View style={styles.valoresDivider} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>{meta.totalLabel}</Text>
            <Text style={styles.totalValor}>{moeda(valorFinal)}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <SectionLabel>FORMA DE PAGAMENTO</SectionLabel>
        {loadingCartao ? (
          <View style={styles.cartaoCard}><ActivityIndicator color={colors.blue} /><Text style={styles.muted}>Consultando cartão principal...</Text></View>
        ) : cartao ? (
          <View style={styles.cartaoCard}>
            <View style={styles.rowBetween}>
              <View style={styles.infoRow}><Ionicons name="card-outline" size={22} color={colors.blue} /><Text style={styles.cartaoTitle}>Cartão principal</Text></View>
              <View style={styles.principalBadge}><Text style={styles.principalBadgeText}>Principal</Text></View>
            </View>
            <Text style={styles.cartaoDetalhes}>{cartao.bandeira || 'Cartão'}  •••• {cartao.ultimosDigitos || '••••'}</Text>
          </View>
        ) : (
          <View style={styles.cartaoCard}>
            <View style={styles.infoRow}><Ionicons name="card-outline" size={22} color={colors.blue} /><Text style={styles.cartaoTitle}>Nenhum cartão principal encontrado</Text></View>
            <Text style={styles.muted}>Cadastre ou defina um cartão principal em Perfil → Formas de pagamento e retorne a esta tela.</Text>
          </View>
        )}
        {!!cartaoError && (
          <View style={styles.erroCard}>
            <Text style={styles.erroTexto}>{cartaoError}</Text>
            <TouchableOpacity onPress={onRetryCartao}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity>
          </View>
        )}
        <View style={styles.avisoCard}>
          <Ionicons name="information-circle" size={21} color={colors.blue} />
          <Text style={styles.avisoText}>A cobrança será realizada no cartão principal cadastrado. Para usar outro cartão, altere o principal em Perfil → Formas de pagamento e retorne a esta tela.</Text>
        </View>

        <View style={styles.divider} />
        <SectionLabel>CONDIÇÕES IMPORTANTES</SectionLabel>
        <View style={styles.condicoesCard}>
          <Ionicons name="information-circle" size={23} color={colors.blue} />
          <View style={styles.condicoesConteudo}>
            <Text style={styles.condicaoText}>• O acesso será disponibilizado após a confirmação do pagamento.</Text>
            <Text style={styles.condicaoText}>• As condições de utilização da oferta permanecem aplicáveis conforme definido pelo estabelecimento.</Text>
            {resumo.recorrente && <Text style={styles.condicaoText}>• Esta é uma contratação recorrente. Confira a periodicidade da cobrança antes de confirmar.</Text>}
          </View>
        </View>
        {!!pagamentoError && <View style={styles.erroCard}><Text style={styles.erroTexto}>{pagamentoError}</Text></View>}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity disabled={!habilitado} style={[styles.ctaButton, !habilitado && styles.disabled]} onPress={onConfirmar} activeOpacity={0.85}>
          {processando ? <ActivityIndicator color="#fff" /> : <><Ionicons name="lock-closed" size={18} color="#fff" /><Text style={styles.ctaButtonText}>Confirmar e pagar</Text></>}
        </TouchableOpacity>
        <View style={styles.secureRow}><Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} /><Text style={styles.secureText}>Pagamento seguro via ConexPass</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  backIcon: { width: 32, paddingVertical: 4 },
  headerSpacer: { width: 32 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6, marginBottom: 12 },
  estabelecimentoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  estabelecimentoImage: { width: 76, height: 76, borderRadius: radius.md },
  estabelecimentoInfo: { flex: 1, gap: 5 },
  estabelecimentoNome: { fontSize: 17, fontWeight: '700', color: colors.text },
  estabelecimentoLocal: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 22 },
  ofertaCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, gap: 12 },
  ofertaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ofertaNome: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  ofertaDescricao: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  infoText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  valoresCard: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  valorItemLabel: { flex: 1, fontSize: 13, color: colors.textMuted },
  valorItemValores: { alignItems: 'flex-end', gap: 4 },
  valorOriginal: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through' },
  valorTexto: { fontSize: 14, color: colors.text, fontWeight: '700' },
  descontoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  descontoBadge: { backgroundColor: colors.successLight, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  descontoBadgeText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  valoresDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  totalLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  totalValor: { fontSize: 21, fontWeight: '800', color: colors.blue },
  cartaoCard: { backgroundColor: '#EFF6FF', borderRadius: radius.md, padding: 16, gap: 12 },
  cartaoTitle: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  cartaoDetalhes: { fontSize: 14, color: colors.textMuted, marginLeft: 31 },
  principalBadge: { backgroundColor: '#DBEAFE', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  principalBadgeText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  avisoCard: { marginTop: 10, backgroundColor: '#EFF6FF', borderRadius: radius.md, padding: 14, flexDirection: 'row', gap: 10 },
  avisoText: { flex: 1, fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  condicoesCard: { flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF', padding: 14, borderRadius: radius.md },
  condicoesConteudo: { flex: 1, gap: 9 },
  condicaoText: { fontSize: 12.5, lineHeight: 19, color: colors.textMuted },
  erroCard: { marginTop: 14, backgroundColor: '#FEF2F2', padding: 12, borderRadius: radius.md },
  erroTexto: { fontSize: 13, lineHeight: 19, color: '#B91C1C' },
  retry: { marginTop: 8, color: colors.blue, fontWeight: '700' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#fff' },
  ctaButton: { height: 52, backgroundColor: colors.blue, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  disabled: { opacity: 0.5 },
  ctaButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 },
  secureText: { fontSize: 12, color: colors.textMuted },
});
