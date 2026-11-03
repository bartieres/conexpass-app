import { useCallback, useEffect, useState } from 'react';
import { consultarPagamento } from '../../../services/assinaturaService';
import OfertaPagamentoResultado from './OfertaPagamentoResultado';

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
      
      const { response } = await consultarPagamento(pagamentoId);
      const { pagamento } = response;
      setStatus(pagamento.situacao.codigo);
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
