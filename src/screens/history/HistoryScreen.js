import React, { useState, useEffect, useCallback, useRef } from 'react';
import { findAllByCondition } from '../../services/checkinService';
import { dateTimeToDateMasked } from '../../utils/date';
import History from './History';

const TAMANHO_PAGINA = 10;

// Períodos disponíveis no filtro rápido (todos ≤ 31 dias, conforme pedido)
const PERIODOS = [
  { id: '7', label: '7 dias', dias: 7 },
  { id: '15', label: '15 dias', dias: 15 },
  { id: '30', label: '30 dias', dias: 30 },
];
const PERIODO_INICIAL = PERIODOS[2]; // 30 dias

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
 * HistoryScreen (container)
 * Responsável por: busca do histórico de check-ins no backend, paginação
 * (infinite scroll), pull-to-refresh e filtro de período.
 *
 * O componente visual (History) só recebe dados e callbacks via props.
 */
export default function HistoryScreen() {
  const [periodoId, setPeriodoId] = useState(PERIODO_INICIAL.id);

  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false); // carga inicial / troca de período
  const [loadingMore, setLoadingMore] = useState(false); // próxima página (rodapé)
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  // Guarda a página atual fora do state (mesmo padrão do ExploreScreen), pra
  // não precisar recriar a função de busca toda vez que a página muda.
  const paginaRef = useRef(0);

  /**
   * Busca o histórico no backend, já paginado.
   *
   * - reset = true (padrão): carga inicial, troca de período e pull-to-refresh.
   *   Volta pra página 0 e substitui a lista.
   * - reset = false: infinite scroll (onEndReached). Busca a próxima página e
   *   concatena no final da lista atual.
   */
  const buscarHistorico = useCallback(
    async ({ reset = true, isRefresh = false, periodoIdOverride } = {}) => {
      // evita disparar duas buscas de "próxima página" ao mesmo tempo
      if (!reset && (loadingMore || !hasMore)) return;

      const periodoAtual = PERIODOS.find((p) => p.id === (periodoIdOverride ?? periodoId)) ?? PERIODO_INICIAL;
      const { dataInicio, dataFim } = calcularIntervalo(periodoAtual.dias);
      const pagina = reset ? 0 : paginaRef.current + 1;

      if (reset) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
        const filtros = {
          dataInicio,
          dataFim
        };

        const pages = {
          page: pagina,
          size: TAMANHO_PAGINA
        }

        console.log('Filtros enviados para o backend:', filtros);

        const data = await findAllByCondition({ ...filtros, ...pages });

        const { content, last } = data.response;

        const formatted = content.map((u) => ({
          id: u.id,
          name: u.nome,
          date: dateTimeToDateMasked(u.data),
          status: u.situacao.codigo === 'CONFIRMADO' ? 'success' : 'error',
          location: u.endereco.cidade.nome + ' - ' + u.endereco.cidade.estado.uf,
        }));

        paginaRef.current = pagina;
        setHasMore(last === false);
        setHistorico((atual) => (reset ? formatted : [...atual, ...formatted]));
      } catch (err) {
        setError(err.friendlyMessage || 'Não foi possível carregar seu histórico.');
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

  // Busca inicial
  useEffect(() => {
    buscarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull-to-refresh: sempre reseta a paginação
  const handleRefresh = useCallback(() => {
    buscarHistorico({ reset: true, isRefresh: true });
  }, [buscarHistorico]);

  // Infinite scroll: busca a próxima página, mantendo o período atual
  const handleLoadMore = useCallback(() => {
    buscarHistorico({ reset: false });
  }, [buscarHistorico]);

  // Chip de período: atualiza o estado e já busca com o valor novo (sem
  // esperar o próximo render, mesmo padrão usado no ExploreScreen)
  const handleSelectPeriodo = useCallback(
    (novoPeriodoId) => {
      setPeriodoId(novoPeriodoId);
      buscarHistorico({ reset: true, periodoIdOverride: novoPeriodoId });
    },
    [buscarHistorico]
  );

  return (
    <History
      historico={historico}
      loading={loading}
      loadingMore={loadingMore}
      refreshing={refreshing}
      error={error}
      hasMore={hasMore}
      onRefresh={handleRefresh}
      onLoadMore={handleLoadMore}
      onRetry={() => buscarHistorico({ reset: true })}
      periodos={PERIODOS}
      periodoId={periodoId}
      onSelectPeriodo={handleSelectPeriodo}
    />
  );
}