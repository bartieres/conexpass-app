import { useCallback, useEffect, useState } from 'react';
import OfertaPagamentoResultado from './OfertaPagamentoResultado';

// Adapte consultarPagamento(pagamentoId) ao endpoint real.
// Não use apenas o HTTP 200 da criação da cobrança como confirmação.
export default function OfertaPagamentoResultadoScreen({ route, navigation }) {
  const { pagamentoId, statusInicial, oferta } = route.params || {};
  const [status, setStatus] = useState(statusInicial || 'PENDENTE');
  const [loading, setLoading] = useState(!statusInicial);
  const [error, setError] = useState('');

  const atualizarStatus = useCallback(async () => {
    if (!pagamentoId) {
      setError('Identificador do pagamento indisponível.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // TODO: const pagamento = await consultarPagamento(pagamentoId);
      // setStatus(pagamento.status);
      setError('A consulta de pagamento ainda não foi integrada.');
    } catch (err) {
      setError(err?.friendlyMessage || 'Não foi possível consultar o pagamento.');
    } finally {
      setLoading(false);
    }
  }, [pagamentoId]);

  useEffect(() => {
    if (!statusInicial) atualizarStatus();
  }, [statusInicial, atualizarStatus]);

  return <OfertaPagamentoResultado navigation={navigation} oferta={oferta} status={status} loading={loading} error={error} onAtualizar={atualizarStatus} />;
}
