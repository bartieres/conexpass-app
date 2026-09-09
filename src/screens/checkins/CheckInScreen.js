import React, { useState, useEffect, useCallback, useRef } from 'react';
import { findAllByCondition } from '../../services/checkinService';
import { getResumo } from '../../services/assinaturaService';
import { dateTimeToDateMasked } from '../../utils/date';
import CheckIns from './CheckIn';

const TAMANHO_PAGINA = 15;

// Períodos disponíveis no dropdown de histórico
const PERIODOS = [
  { id: '7', label: 'Últimos 7 dias', dias: 7 },
  { id: '15', label: 'Últimos 15 dias', dias: 15 },
  { id: '30', label: 'Últimos 30 dias', dias: 30 },
];
const PERIODO_INICIAL = PERIODOS[2]; // 30 dias

// Mapeia o código do tipo de check-in que vem do backend pro rótulo exibido
function formatarTipo(tipo) {
  const codigo = tipo?.codigo || tipo;
  if (codigo === 'PLANO') return 'Plano';
  if (codigo === 'AVULSO') return 'Avulso';
  if (codigo === 'BONUS') return 'Bônus';
  return tipo?.descricao || 'Check-in';
}

// "Hoje" para o dia atual, senão "02 de setembro"
function formatarRotuloData(dataISO) {
  const data = new Date(dataISO);
  const hoje = new Date();
  const mesmoDia =
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear();

  if (mesmoDia) return 'Hoje';

  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
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

/**
 * CheckInsScreen (container)
 * Tela única que substitui as antigas "Check-in" (QR Code) e "Histórico".
 * Responsável por: resumo de check-ins disponíveis (plano/avulso/bônus),
 * histórico paginado com filtro de período (infinite scroll) e pull-to-refresh.
 *
 * O componente visual (CheckIns) só recebe dados e callbacks via props.
 */
export default function CheckInsScreen() {
  const [periodoId, setPeriodoId] = useState(PERIODO_INICIAL.id);

  // Resumo (card do topo)
  const [resumo, setResumo] = useState(null);
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [resumoError, setResumoError] = useState('');

  // Histórico + paginação
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true); // carga inicial / troca de período
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historicoError, setHistoricoError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const paginaRef = useRef(0);

  /**
   * Busca o resumo de check-ins disponíveis (card do topo).
   *
   * TODO: confirmar o endpoint/formato exato no backend. Assumindo algo como
   * GET /checkins/resumo -> { disponiveis, plano, avulso, bonus }.
   */
  const buscarResumo = useCallback(async () => {
    setLoadingResumo(true);
    setResumoError('');
    try {
      const data = await getResumo();
      const { plano, qtdPlano, qtdAvulso, qtdBonus } = data.response;

      setResumo({
        disponiveis: qtdPlano ?? 0,
        plano: plano.nome ?? 0,
        avulso: qtdAvulso ?? 0,
        bonus: qtdBonus ?? 0,
      });
    } catch (err) {
      setResumoError(err.friendlyMessage || 'Não foi possível carregar seu resumo de check-ins.');
    } finally {
      setLoadingResumo(false);
    }
  }, []);

  /**
   * Busca o histórico de check-ins, paginado e filtrado por período.
   *
   * - reset = true (padrão): carga inicial, troca de período e pull-to-refresh.
   *   Volta pra página 0 e substitui a lista.
   * - reset = false: infinite scroll (onEndReached). Busca a próxima página
   *   e concatena no final.
   */
  const buscarHistorico = useCallback(
    async ({ reset = true, isRefresh = false, periodoIdOverride } = {}) => {
      if (!reset && (loadingMore || !hasMore)) return;

      const periodoAtual = PERIODOS.find((p) => p.id === (periodoIdOverride ?? periodoId)) ?? PERIODO_INICIAL;
      const { dataInicio, dataFim } = calcularIntervalo(periodoAtual.dias);
      const pagina = reset ? 0 : paginaRef.current + 1;

      if (reset) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setHistoricoError('');

      try {
        const data = await findAllByCondition({
          dataInicio,
          dataFim,
          page: pagina,
          size: TAMANHO_PAGINA,
        });
        const { content, last } = data.response;

        const formatted = content.map((c) => ({
          id: c.id,
          establishmentName: c.estabelecimento?.razaoSocial || c.nome,
          dateLabel: formatarRotuloData(c.data),
          dateRaw: c.data,
          formattedTime: dateTimeToDateMasked(c.data),
          type: formatarTipo(c.tipo),
          status: c.situacao?.codigo === 'CONFIRMADO' ? 'success' : 'error',
        }));

        paginaRef.current = pagina;
        setHasMore(last === false);
        setHistorico((atual) => (reset ? formatted : [...atual, ...formatted]));
      } catch (err) {
        setHistoricoError(err.friendlyMessage || 'Não foi possível carregar seu histórico de check-ins.');
      } finally {
        if (reset) {
          isRefresh ? setRefreshing(false) : setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [periodoId, loadingMore, hasMore]
  );

  useEffect(() => {
    buscarResumo();
    buscarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull-to-refresh: atualiza resumo e histórico juntos
  const handleRefresh = useCallback(() => {
    buscarResumo();
    buscarHistorico({ reset: true, isRefresh: true });
  }, [buscarResumo, buscarHistorico]);

  const handleLoadMore = useCallback(() => {
    buscarHistorico({ reset: false });
  }, [buscarHistorico]);

  // Dropdown de período: atualiza o estado e já busca com o valor novo
  const handleSelectPeriodo = useCallback(
    (novoPeriodoId) => {
      setPeriodoId(novoPeriodoId);
      buscarHistorico({ reset: true, periodoIdOverride: novoPeriodoId });
    },
    [buscarHistorico]
  );

  return (
    <CheckIns
      resumo={resumo}
      loadingResumo={loadingResumo}
      resumoError={resumoError}
      historico={historico}
      loading={loading}
      loadingMore={loadingMore}
      refreshing={refreshing}
      historicoError={historicoError}
      hasMore={hasMore}
      onRefresh={handleRefresh}
      onLoadMore={handleLoadMore}
      onRetryResumo={buscarResumo}
      onRetryHistorico={() => buscarHistorico({ reset: true })}
      periodos={PERIODOS}
      periodoId={periodoId}
      onSelectPeriodo={handleSelectPeriodo}
    />
  );
}