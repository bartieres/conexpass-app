import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { findById } from '../../../services/estabelecimentoService';
import { findCreditCardPrincipalByUsuario } from '../../../services/formaPagamentoService';
import { contratarOferta } from '../../../services/assinaturaService';
import { colors, radius } from '../../../theme/theme';
import OfertaCheckout from './OfertaCheckout';

function criarChaveIdempotencia() {
  return `oferta-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function normalizarEstabelecimento(e) {
  return {
    ...e,
    id: e.id,
    name: e.nomeFantasia || e.razaoSocial || 'Estabelecimento',
    categoria: e.tipo?.descricao ?? null,
    cidade: e.endereco?.cidade?.nome ?? null,
    uf: e.endereco?.cidade?.estado?.uf ?? null,
  };
}

function calcularValorFinal(oferta) {
  if (oferta?.valor == null || oferta.valor === '') return null;
  const valor = Number(oferta.valor);
  if (!Number.isFinite(valor) || valor < 0) return null;
  if (oferta.valorPromocional != null && oferta.valorPromocional !== '') {
    const promocional = Number(oferta.valorPromocional);
    if (Number.isFinite(promocional) && promocional >= 0 && promocional < valor) return promocional;
  }
  return valor;
}

export default function OfertaCheckoutScreen({ route, navigation }) {
  const oferta = route.params?.oferta;
  const estabelecimentoId = route.params?.estabelecimentoId ?? oferta?.estabelecimento?.id;

  const [estabelecimento, setEstabelecimento] = useState(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(true);
  const [detalhesError, setDetalhesError] = useState('');
  const [cartao, setCartao] = useState(null);
  const [loadingCartao, setLoadingCartao] = useState(true);
  const [cartaoError, setCartaoError] = useState('');
  const [processando, setProcessando] = useState(false);
  const [pagamentoError, setPagamentoError] = useState('');
  const processandoRef = useRef(false);
  const chaveIdempotenciaRef = useRef(null);

  const buscarDetalhes = useCallback(async () => {
    if (estabelecimentoId == null) {
      setLoadingDetalhes(false);
      setDetalhesError('Não foi possível identificar o estabelecimento.');
      return;
    }
    setLoadingDetalhes(true);
    setDetalhesError('');
    setEstabelecimento(null);
    try {
      const data = await findById(estabelecimentoId);
      const e = data?.response ?? data?.data?.response ?? data;
      if (!e?.id) throw new Error('Estabelecimento não encontrado.');
      setEstabelecimento(normalizarEstabelecimento(e));
    } catch (err) {
      setDetalhesError(err?.friendlyMessage || err?.message || 'Não foi possível carregar o estabelecimento.');
    } finally {
      setLoadingDetalhes(false);
    }
  }, [estabelecimentoId]);

  useEffect(() => { buscarDetalhes(); }, [buscarDetalhes]);

  const carregarCartao = useCallback(async () => {
    setLoadingCartao(true);
    setCartaoError('');
    setCartao(null);
    try {
      const data = await findCreditCardPrincipalByUsuario();
      const response = data?.response ?? data?.data?.response;
      const principal = response?.cartao;
      if (principal) {
        setCartao({
          id: response.id ?? principal.id,
          bandeira: principal.bandeira,
          ultimosDigitos: principal.ultimosDigitos,
          validade: principal.validade,
        });
      }
    } catch (err) {
      if (err?.response?.status !== 404 && err?.status !== 404) {
        setCartaoError(err?.friendlyMessage || 'Não foi possível consultar o cartão principal.');
      }
    } finally {
      setLoadingCartao(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    carregarCartao();
  }, [carregarCartao]));

  const resumo = useMemo(() => {
    if (!oferta || !estabelecimento) return null;
    const condicoes = Array.isArray(oferta.condicoes) ? oferta.condicoes : [];
    const buscarCondicao = label => condicoes.find(item => item.label?.toLowerCase() === label.toLowerCase())?.valor;
    return {
      id: oferta.id,
      nome: oferta.nome,
      descricao: oferta.descricao,
      tipo: oferta.tipo,
      valor: oferta.valor,
      valorPromocional: oferta.valorPromocional,
      estabelecimento,
      quantidadeAcessos: buscarCondicao('Quantidade de acessos'),
      validade: buscarCondicao('Validade dos acessos'),
      modalidades: buscarCondicao('Modalidades incluídas'),
      cobranca: buscarCondicao('Cobrança'),
      recorrente: oferta.tipo?.codigo === 'RECORRENTE',
    };
  }, [oferta, estabelecimento]);

  const valorFinal = useMemo(() => calcularValorFinal(oferta), [oferta?.valor, oferta?.valorPromocional]);

  const handleConfirmar = useCallback(async () => {
    if (processandoRef.current || !oferta?.id || estabelecimentoId == null || !estabelecimento || !cartao || valorFinal == null || loadingCartao || cartaoError) return;
    processandoRef.current = true;
    setProcessando(true);
    setPagamentoError('');
    if (!chaveIdempotenciaRef.current) chaveIdempotenciaRef.current = criarChaveIdempotencia();
    try {
      // Contrato real do serviço de assinatura: payload com a oferta e chave de idempotência.
      const resultado = await contratarOferta(
        { oferta: { id: oferta.id } },
        { chaveIdempotencia: chaveIdempotenciaRef.current }
      );
      const pagamento = resultado?.response ?? resultado?.data?.response;
      const pagamentoId = pagamento?.pagamentoId ?? pagamento?.id;
      if (pagamentoId == null) throw new Error('O backend não retornou a identificação do pagamento. Consulte suas contratações antes de tentar novamente.');
      const status = pagamento.status?.codigo ?? pagamento.status;
      navigation.replace('EstabelecimentoOfertaPagamentoResultado', {
        pagamentoId,
        statusInicial: status ?? 'PENDENTE',
        oferta: { ...oferta, estabelecimento },
      });
    } catch (err) {
      setPagamentoError(err?.friendlyMessage || err?.message || 'Não foi possível processar o pagamento. Consulte a situação da cobrança antes de tentar novamente.');
    } finally {
      processandoRef.current = false;
      setProcessando(false);
    }
  }, [oferta, estabelecimentoId, estabelecimento, cartao, valorFinal, loadingCartao, cartaoError, navigation]);

  if (loadingDetalhes) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.blue} /><Text style={styles.message}>Carregando resumo da contratação...</Text></View>;
  }

  if (detalhesError || !resumo) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color="#DC2626" />
        <Text style={styles.title}>Não foi possível carregar o resumo</Text>
        <Text style={styles.message}>{detalhesError || 'Não foi possível obter os dados necessários.'}</Text>
        {estabelecimentoId != null && <TouchableOpacity style={styles.retryButton} onPress={buscarDetalhes}><Text style={styles.retryText}>Tentar novamente</Text></TouchableOpacity>}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <OfertaCheckout
      navigation={navigation}
      resumo={resumo}
      cartao={cartao}
      loadingCartao={loadingCartao}
      cartaoError={cartaoError}
      processando={processando}
      pagamentoError={pagamentoError}
      onRetryCartao={carregarCartao}
      onConfirmar={handleConfirmar}
      podeConfirmar={!!cartao && !loadingCartao && !cartaoError && !processando && valorFinal != null}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  title: { marginTop: 16, fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { marginTop: 12, fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
  retryButton: { marginTop: 24, height: 48, paddingHorizontal: 28, borderRadius: radius.pill, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  backButton: { marginTop: 14, padding: 10 },
  backText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
