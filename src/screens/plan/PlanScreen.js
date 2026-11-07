import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getMinhasAssinaturas,
  cancelarRenovacao,
  cancelarProximoPlano,
} from '../../services/assinaturaService';
import {
  derivarPainel,
  permiteAcao,
  podeAlterarAtual,
  podeAgendarProximo,
  formatarDataPlano,
} from '../../utils/assinaturasPlano';
import Plan from './Plan';

export default function PlanScreen({ navigation }) {
  const [assinaturas, setAssinaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [operacao, setOperacao] = useState(null);
  const operacaoRef = useRef(false);
  const focoRef = useRef(false);
  const versaoRef = useRef(0);
  const painel = derivarPainel(assinaturas);
  const { planoAtual, proximoPlano, pagamentosPendentes } = painel;

  const buscarAssinaturas = useCallback(async ({ inicial = false } = {}) => {
    const versao = ++versaoRef.current;
    if (focoRef.current) {
      if (inicial) setLoading(true);
      setError('');
    }
    try {
      const { response } = await getMinhasAssinaturas();
      if (!focoRef.current || versao !== versaoRef.current) return false;
      setAssinaturas(response);
      return true;
    } catch (err) {
      if (focoRef.current && versao === versaoRef.current) {
        setError(
          err.friendlyMessage ||
            err.message ||
            'Não foi possível carregar seus planos.'
        );
      }
      return false;
    } finally {
      if (focoRef.current && versao === versaoRef.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      focoRef.current = true;
      if (!operacaoRef.current) setOperacao(null);
      buscarAssinaturas({ inicial: true });
      return () => {
        focoRef.current = false;
        versaoRef.current++;
      };
    }, [buscarAssinaturas])
  );

  const executar = async (tipo, acao, mensagem) => {
    if (operacaoRef.current || !focoRef.current) return;
    operacaoRef.current = true;
    ++versaoRef.current; // Invalida consultas iniciadas antes da mutação.
    setOperacao(tipo);
    setError('');
    try {
      await acao();
      const atualizado = await buscarAssinaturas();
      if (atualizado && focoRef.current && mensagem)
        Alert.alert('Pronto', mensagem);
    } catch (err) {
      const conflito = (err.response?.status ?? err.status) === 409;
      if (conflito) await buscarAssinaturas();
      if (focoRef.current) {
        Alert.alert(
          conflito ? 'Situação atualizada' : 'Não foi possível concluir',
          conflito
            ? 'A situação da assinatura mudou e a cobrança pode ter iniciado. Confira os dados atualizados antes de continuar.'
            : err.friendlyMessage || 'Tente novamente mais tarde.'
        );
      }
    } finally {
      operacaoRef.current = false;
      if (focoRef.current) setOperacao(null);
    }
  };

  const handleCancelarRenovacao = () => {
    if (
      operacaoRef.current ||
      !planoAtual?.id ||
      planoAtual.podeUtilizar !== true ||
      planoAtual.renovacaoAutomatica !== true ||
      pagamentosPendentes.length > 0 ||
      !permiteAcao(planoAtual, 'CANCELAR_RENOVACAO')
    )
      return;
    const fim = formatarDataPlano(planoAtual.fimVigencia, true);
    Alert.alert(
      'Cancelar renovação?',
      `Você continuará utilizando seu plano até ${fim}. Depois dessa data, não haverá renovação automática.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar renovação',
          style: 'destructive',
          onPress: () =>
            executar(
              'CANCELAR_RENOVACAO',
              () => cancelarRenovacao(planoAtual.id),
              `Renovação cancelada. Seu plano continua disponível até ${fim}.`
            ),
        },
      ]
    );
  };

  const handleCancelarProximo = () => {
    if (
      operacaoRef.current ||
      proximoPlano?.situacao.codigo !== 'AGENDADO' ||
      !permiteAcao(proximoPlano, 'CANCELAR_PROXIMO')
    )
      return;
    Alert.alert(
      'Cancelar próximo plano?',
      'O plano agendado será removido. Seu plano atual não será alterado e continuará com a renovação cancelada.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar próximo plano',
          style: 'destructive',
          onPress: () =>
            executar(
              'CANCELAR_PROXIMO',
              cancelarProximoPlano,
              'Próximo plano cancelado.'
            ),
        },
      ]
    );
  };

  const escolher = (modo) => {
    if (operacaoRef.current || loading || error) return;
    if (
      modo === 'ALTERAR_ATUAL' &&
      !podeAlterarAtual(planoAtual, proximoPlano, pagamentosPendentes)
    )
      return;
    if (
      modo === 'AGENDAR_PROXIMO' &&
      !podeAgendarProximo(planoAtual, proximoPlano, pagamentosPendentes)
    )
      return;
    if (
      modo === 'ALTERAR_PROXIMO' &&
      !permiteAcao(proximoPlano, 'ALTERAR_PROXIMO')
    )
      return;
    if (modo === 'ESCOLHER' && !painel.semAssinatura) return;
    navigation.navigate('ChangePlan', {
      modo,
      planoAtual: planoAtual
        ? {
            ...planoAtual.plano,
            valor: planoAtual.valor,
            proximaCobranca: { data: planoAtual.dataProximaCobranca },
          }
        : null,
      planoAtualId: planoAtual?.id,
      planoAgendadoId: proximoPlano?.id,
      planoAgendado: proximoPlano?.plano,
      dataInicioVigencia:
        modo === 'ALTERAR_PROXIMO'
          ? proximoPlano?.dataInicioVigencia
          : planoAtual?.fimVigencia,
    });
  };

  return (
    <Plan
      {...painel}
      navigation={navigation}
      loading={loading}
      operacao={operacao}
      error={error}
      onRetry={() => executar('ATUALIZAR', async () => {}, '')}
      onAlterarPlano={() => escolher('ALTERAR_ATUAL')}
      onEscolherPlano={() => escolher('ESCOLHER')}
      onAgendarProximo={() => escolher('AGENDAR_PROXIMO')}
      onCancelarRenovacao={handleCancelarRenovacao}
      onAlterarProximo={() => escolher('ALTERAR_PROXIMO')}
      onCancelarProximo={handleCancelarProximo}
    />
  );
}
