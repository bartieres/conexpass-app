import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  listarAtivos,
  listarPendentes,
  listarHistorico,
} from '../../services/meusAcessosService';

import MeusAcessos from './MeusAcessos';

const TAMANHO_PAGINA = 15;

// Filtros disponíveis na aba Histórico
const PERIODOS = [
  { id: null, label: 'Todos os períodos', dias: 30 },
  { id: 7, label: 'Últimos 7 dias', dias: 7 },
  { id: 15, label: 'Últimos 15 dias', dias: 15 },
  { id: 30, label: 'Últimos 30 dias', dias: 30 },
];

const ORIGENS = [
  { id: null, label: 'Todas as origens' },
  { id: 'PLANO_ESTABELECIMENTO', label: 'Plano do estabelecimento' },
  { id: 'PLANO_COMPARTILHADO', label: 'Plano compartilhado' },
  { id: 'AVULSO', label: 'Avulso' },
  { id: 'BONUS', label: 'Bônus' },
];

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarDataISO(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function calcularIntervalo(dias) {
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - dias);
  return {
    dataInicio: formatarDataISO(dataInicio),
    dataFim: formatarDataISO(dataFim),
  };
}

// "Novembro de 2026"
function formatarMesLabel(dataISO) {
  const data = new Date(dataISO);
  const mes = data.toLocaleDateString('pt-BR', { month: 'long' });
  return `${capitalizar(mes)} de ${data.getFullYear()}`;
}

export default function MeusAcessosScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('ativos');

  // Ativos
  const [ativos, setAtivos] = useState([]);
  const [loadingAtivos, setLoadingAtivos] = useState(true);
  const [ativosError, setAtivosError] = useState('');
  const [refreshingAtivos, setRefreshingAtivos] = useState(false);
  const ativosCarregadosRef = useRef(false);

  // Pendentes
  const [pendentes, setPendentes] = useState([]);
  const [loadingPendentes, setLoadingPendentes] = useState(true);
  const [pendentesError, setPendentesError] = useState('');
  const [refreshingPendentes, setRefreshingPendentes] = useState(false);
  const pendentesCarregadosRef = useRef(false);

  // Histórico
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [loadingMoreHistorico, setLoadingMoreHistorico] = useState(false);
  const [refreshingHistorico, setRefreshingHistorico] = useState(false);
  const [historicoError, setHistoricoError] = useState('');
  const [hasMoreHistorico, setHasMoreHistorico] = useState(true);
  const [periodoId, setPeriodoId] = useState(PERIODOS[0].id);
  const [origemId, setOrigemId] = useState(ORIGENS[0].id);
  const historicoCarregadoRef = useRef(false);
  const paginaRef = useRef(0);

  const buscarAtivos = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingAtivos(true);
    setAtivosError('');

    try {
      const data = await listarAtivos();

      const formatted = data?.response?.map((item) => ({
        id: item.id,
        estabelecimento: {
          id: item.estabelecimento?.id,
          name: item.estabelecimento?.razaoSocial,
          image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
        },
        nome: item.nome,
        origem: {
          codigo: item.origem?.codigo,
          descricao: item.origem?.descricao,
        },
        ilimitado: item.ilimitado,
        disponiveis: item.disponiveis,
        total: item.total,
        proximaRenovacao: item.proximaRenovacao ? item.proximaRenovacao : null,
        validoAte: item.validoAte ? item.validoAte : null,
      }));

      setAtivos(formatted);
      ativosCarregadosRef.current = true;
    } catch (err) {
      setAtivosError(
        err.friendlyMessage || 'Não foi possível carregar seus acessos ativos.'
      );
    } finally {
      if (!silent) setLoadingAtivos(false);
    }
  }, []);

  const buscarPendentes = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingPendentes(true);
    setPendentesError('');

    try {
      const data = await listarPendentes();

      const formatted = (data?.response ?? []).map((item) => ({
        id: item.id,
        estabelecimento: {
          id: item.estabelecimento?.id ?? null,
          name: item.estabelecimento?.razaoSocial ?? null,
          image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
        },
        nome: item.nome,
        origem: item.origem,
        situacao: item.situacao ?? item.status ?? null,
        contratadoEm: item.contratadoEm ?? item.createdAt ?? null,
      }));

      setPendentes(formatted);
      pendentesCarregadosRef.current = true;
    } catch (err) {
      setPendentesError(
        err.friendlyMessage ||
          'Não foi possível carregar suas contratações pendentes.'
      );
    } finally {
      if (!silent) setLoadingPendentes(false);
    }
  }, []);

  const buscarHistorico = useCallback(
    async ({ reset = true, isRefresh = false, periodoOverride, origemOverride } = {}) => {
      if (!reset && (loadingMoreHistorico || !hasMoreHistorico)) return;

      const pagina = reset ? 0 : paginaRef.current + 1;

      if (reset) {
        isRefresh ? setRefreshingHistorico(true) : setLoadingHistorico(true);
      } else {
        setLoadingMoreHistorico(true);
      }
      setHistoricoError('');

      try {
        const periodoAtual =
          PERIODOS.find((p) => p.id === (periodoOverride ?? periodoId)) ?? PERIODOS[0];
          console.log('periodoAtual', periodoAtual);
        const { dataInicio, dataFim } = calcularIntervalo(periodoAtual.dias);
        console.log('dataInicio', dataInicio, 'dataFim', dataFim);

        const data = await listarHistorico({
          periodoDias: periodoOverride !== undefined ? periodoOverride : periodoId,
          origemCodigo: origemOverride !== undefined ? origemOverride : origemId,
          dataInicio,
          dataFim,
          page: pagina,
          size: TAMANHO_PAGINA,
        });
        const { content, last } = data.response;

        const formatted = content.map((item) => ({
          id: item.id,
          estabelecimento: {
            id: item.estabelecimento?.id,
            name: item.estabelecimento?.razaoSocial,
            image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
          },
          data: item.data,
          dataSolicitacao: item.dataSolicitacao,
          situacao: item.situacao,
          origem: item.origem,
          mesLabel: formatarMesLabel(item.dataSolicitacao),
        }));

        paginaRef.current = pagina;
        setHasMoreHistorico(last === false);
        setHistorico((atual) => (reset ? formatted : [...atual, ...formatted]));
        historicoCarregadoRef.current = true;
      } catch (err) {
        setHistoricoError(
          err.friendlyMessage ||
            'Não foi possível carregar seu histórico de check-ins.'
        );
      } finally {
        if (reset) {
          isRefresh ? setRefreshingHistorico(false) : setLoadingHistorico(false);
        } else {
          setLoadingMoreHistorico(false);
        }
      }
    },
    [periodoId, origemId, loadingMoreHistorico, hasMoreHistorico]
  );

  // Carga inicial: só a aba "Ativos" (a que abre por padrão).
  useEffect(() => {
    buscarAtivos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza Ativos/Pendentes ao voltar pra tela, só se já tiverem sido
  // carregadas alguma vez — mesmo padrão usado em EstablishmentDetailScreen.
  useFocusEffect(
    useCallback(() => {
      if (ativosCarregadosRef.current) buscarAtivos({ silent: true });
      if (pendentesCarregadosRef.current) buscarPendentes({ silent: true });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleChangeTab = (tab) => {
    setActiveTab(tab);

    if (tab === 'pendentes' && !pendentesCarregadosRef.current) {
      buscarPendentes();
    }
    if (tab === 'historico' && !historicoCarregadoRef.current) {
      buscarHistorico();
    }
  };

  const handleSelectPeriodo = (novoPeriodoId) => {
    setPeriodoId(novoPeriodoId);
    buscarHistorico({ reset: true, periodoOverride: novoPeriodoId });
  };

  const handleSelectOrigem = (novoOrigemId) => {
    setOrigemId(novoOrigemId);
    buscarHistorico({ reset: true, origemOverride: novoOrigemId });
  };

  const handleAbrirAtivo = (item) => {
    navigation.navigate('EstabelecimentoDetail', {
      id: item.estabelecimento?.id,
    });
  };

  return (
    <MeusAcessos
      navigation={navigation}
      activeTab={activeTab}
      onChangeTab={handleChangeTab}
      ativos={ativos}
      loadingAtivos={loadingAtivos}
      ativosError={ativosError}
      onRetryAtivos={buscarAtivos}
      refreshingAtivos={refreshingAtivos}
      onRefreshAtivos={async () => {
        setRefreshingAtivos(true);
        try {
          await buscarAtivos({ silent: true });
        } finally {
          setRefreshingAtivos(false);
        }
      }}
      onAbrirAtivo={handleAbrirAtivo}
      pendentes={pendentes}
      loadingPendentes={loadingPendentes}
      pendentesError={pendentesError}
      onRetryPendentes={buscarPendentes}
      refreshingPendentes={refreshingPendentes}
      onRefreshPendentes={async () => {
        setRefreshingPendentes(true);
        try {
          await buscarPendentes({ silent: true });
        } finally {
          setRefreshingPendentes(false);
        }
      }}
      historico={historico}
      loadingHistorico={loadingHistorico}
      loadingMoreHistorico={loadingMoreHistorico}
      refreshingHistorico={refreshingHistorico}
      historicoError={historicoError}
      hasMoreHistorico={hasMoreHistorico}
      onRefreshHistorico={() => buscarHistorico({ reset: true, isRefresh: true })}
      onLoadMoreHistorico={() => buscarHistorico({ reset: false })}
      onRetryHistorico={() => buscarHistorico({ reset: true })}
      periodos={PERIODOS}
      periodoId={periodoId}
      onSelectPeriodo={handleSelectPeriodo}
      origens={ORIGENS}
      origemId={origemId}
      onSelectOrigem={handleSelectOrigem}
    />
  );
}
