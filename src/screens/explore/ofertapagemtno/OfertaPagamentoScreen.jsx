import { useCallback, useEffect, useState } from 'react';
import OfertaPagamento from './OfertaPagamento';

// Adapte estes dois métodos aos serviços reais do projeto.
// buscarCartaoPrincipal: retorna { id, bandeira, ultimosDigitos } ou null.
// criarPagamento: retorna { pagamentoId, status }.
export default function OfertaPagamentoScreen({ route, navigation }) {
  const oferta = route.params?.oferta;
  const [cartao, setCartao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState('');

  const carregarCartao = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: substituir pelo serviço existente de formas de pagamento.
      // Exemplo: const principal = await buscarCartaoPrincipal();
      const principal = null;
      setCartao(principal);
    } catch (err) {
      setError(err?.friendlyMessage || 'Não foi possível consultar o cartão principal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarCartao(); }, [carregarCartao]);

  const handleConfirmar = useCallback(async () => {
    if (!oferta?.id || !cartao?.id || processando) return;
    setProcessando(true);
    setError('');
    try {
      // TODO: integrar com API real. O backend deve validar preço, elegibilidade,
      // cartão principal do usuário autenticado e idempotência da cobrança.
      // const resultado = await criarPagamento({ ofertaId: oferta.id });
      // navigation.replace('OfertaPagamentoResultado', {
      //   pagamentoId: resultado.pagamentoId,
      //   statusInicial: resultado.status,
      //   oferta,
      // });
      setError('A integração de pagamento ainda não foi configurada.');
    } catch (err) {
      setError(err?.friendlyMessage || 'Não foi possível solicitar o pagamento. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }, [oferta, cartao, processando, navigation]);

  return (
    <OfertaPagamento
      navigation={navigation}
      oferta={oferta}
      cartao={cartao}
      loading={loading}
      processando={processando}
      error={error}
      onRetry={carregarCartao}
      onConfirmar={handleConfirmar}
    />
  );
}
