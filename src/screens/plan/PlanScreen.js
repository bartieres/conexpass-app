import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getMeuPlano } from '../../services/planoService';
import Plan from './Plan';

/**
 * PlanScreen (container)
 * Busca o plano atual do usuário e centraliza a navegação pros submenus
 * (Alterar plano, Pagamentos, Forma de pagamento, Histórico) e o cancelamento.
 */
export default function PlanScreen({ navigation }) {
  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscarPlano = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: confirmar endpoint/formato exato no backend
      const data = await getMeuPlano();
      setPlano(data);
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar seu plano.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarPlano();
  }, [buscarPlano]);

  const handleCancelarPlano = () => {
    Alert.alert(
      'Cancelar plano',
      'Seu acesso continua ativo até o fim do período já pago. Deseja mesmo cancelar sua assinatura?',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar plano',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: chamar o endpoint de cancelamento no backend
              await planoService.cancelarPlano();
              Alert.alert('Plano cancelado', 'Sua assinatura foi cancelada com sucesso.');
              buscarPlano();
            } catch (err) {
              Alert.alert('Não foi possível cancelar', err.friendlyMessage || 'Tente novamente mais tarde.');
            }
          },
        },
      ]
    );
  };

  return (
    <Plan
      navigation={navigation}
      plano={plano}
      loading={loading}
      error={error}
      onRetry={buscarPlano}
      onVerDetalhes={() => navigation.navigate('PlanHistory')}
      onAlterarPlano={() => navigation.navigate('ChangePlan', { planoAtual: plano })}
      onPagamentos={() => navigation.navigate('Payment')}
      onFormaPagamento={() => navigation.navigate('PaymentMethod')}
      onHistorico={() => navigation.navigate('PlanHistory')}
      onCancelarPlano={handleCancelarPlano}
    />
  );
}
