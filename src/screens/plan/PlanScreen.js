import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMeuPlano, cancelarPlano } from '../../services/assinaturaService';
import Plan from './Plan';

/**
 * PlanScreen (container)
 * Busca o plano atual do usuário e centraliza a navegação pros submenus
 * (Alterar plano, Pagamentos, Forma de pagamento, Histórico) e o cancelamento.
 *
 * IMPORTANTE: o usuário pode ainda não ter nenhuma assinatura contratada.
 * Esse caso é tratado explicitamente (temAssinatura = false) — não é um erro,
 * é um estado normal (usuário novo, ou que cancelou e ainda não recontratou).
 */
export default function PlanScreen({ navigation }) {
  const [plano, setPlano] = useState(null);
  const [temAssinatura, setTemAssinatura] = useState(true); // otimista até a 1ª resposta chegar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscarPlano = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMeuPlano();
      const response = data.response;

      // TODO: confirmar como o backend sinaliza "sem assinatura" — pode ser
      // response.plano nulo, response vazio, ou um código específico em
      // response.situacao.codigo (ex: 'SEM_ASSINATURA'). Ajuste essa
      // condição assim que o contrato real do endpoint for confirmado.
      if (!response?.plano) {
        setTemAssinatura(false);
        setPlano(null);
        return;
      }

      const planoContratado = response.plano;

      setTemAssinatura(true);
      setPlano({
        id: planoContratado.id,
        ativo: response.situacao?.codigo === 'ATIVO',
        nome: `Plano ${planoContratado.nome}`,
        descricao: planoContratado.descricao,
        nivel: planoContratado.nivel,
        valor: response.valor,
        dataContratacao: response.dataContratacao,
        proximaCobranca: {
          data: response.dataProximaCobranca,
          valor: planoContratado.valor,
        },
        beneficios: planoContratado.beneficios,
      });
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar seu plano.');
    } finally {
      setLoading(false);
    }
  }, []);

  // useFocusEffect (em vez de useEffect simples) faz a busca rodar toda vez
  // que essa tela GANHA FOCO — não só na primeira montagem. É o que garante
  // o refresh automático ao voltar do ChangePlanScreen depois de trocar de
  // plano, sem precisar de nenhum parâmetro especial indo e voltando entre
  // as telas.
  useFocusEffect(
    useCallback(() => {
      buscarPlano();
    }, [buscarPlano])
  );

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
              // TODO: confirmar nome/formato exato do endpoint no backend
              await cancelarPlano();
              Alert.alert(
                'Plano cancelado',
                'Sua assinatura foi cancelada com sucesso.'
              );
              buscarPlano();
            } catch (err) {
              Alert.alert(
                'Não foi possível cancelar',
                err.friendlyMessage || 'Tente novamente mais tarde.'
              );
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
      temAssinatura={temAssinatura}
      loading={loading}
      error={error}
      onRetry={buscarPlano}
      onAlterarPlano={() =>
        navigation.navigate('ChangePlan', { planoAtual: plano })
      }
      onEscolherPlano={() =>
        navigation.navigate('ChangePlan', { planoAtual: null })
      }
      onHistorico={() => navigation.navigate('PlanHistory')}
      onCancelarPlano={handleCancelarPlano}
    />
  );
}
