import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { findAllByCondition } from '../../services/estabelecimentoService';
import Explore from './Explore';

const RAIO_INICIAL_KM = 10;
const TAMANHO_PAGINA = 10;

export function formatarDistancia(distanciaMetros) {
  if (distanciaMetros < 1000) {
    return `${Math.round(distanciaMetros)} m`;
  }

  return `${(distanciaMetros / 1000).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })} km`;
}

/**
 * ExploreScreen (container)
 * Responsável por: localização do usuário, busca de estabelecimentos no backend,
 * paginação (infinite scroll), estado de loading/erro, pull-to-refresh e todos
 * os filtros (texto, categoria rápida, e os filtros completos vindos da
 * FiltersScreen: categorias, raio, estrelas mínimas e ordenação).
 *
 * O componente visual (Explore) só recebe dados e callbacks via props.
 */
export default function ExploreScreen({ navigation }) {
  const [search, setSearch] = useState('');

  // Filtros completos (também editáveis via FiltersScreen)
  const [categorias, setCategorias] = useState([]); // [] = "todos"
  const [raioKm, setRaioKm] = useState(RAIO_INICIAL_KM);
  const [estrelasMin, setEstrelasMin] = useState(0);
  const [ordenarPor, setOrdenarPor] = useState('distancia');

  // Localização do usuário
  const {
    coords,
    loading: loadingLocation,
    permissionDenied,
    errorMessage: locationError,
    refetch: refetchLocation,
  } = useCurrentLocation();

  // Estabelecimentos + paginação
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState(null);
  const [loadingEstabelecimentos, setLoadingEstabelecimentos] = useState(false); // carga inicial / troca de filtro
  const [loadingMore, setLoadingMore] = useState(false); // carregando próxima página (rodapé)
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh
  const [estabelecimentosError, setEstabelecimentosError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const paginaRef = useRef(0);

  const buscarEstabelecimentos = useCallback(
    async ({
      reset = true,
      isRefresh = false,
      termoOverride,
      categoriasOverride,
      raioOverride,
      estrelasMinOverride,
      ordenarPorOverride,
    } = {}) => {
      if (!coords) return;

      if (!reset && (loadingMore || !hasMore)) return;

      const termo = termoOverride ?? search;
      const categoriasAtuais = categoriasOverride ?? categorias;
      const raio = raioOverride ?? raioKm;
      const estrelas = estrelasMinOverride ?? estrelasMin;
      const ordenacao = ordenarPorOverride ?? ordenarPor;
      const pagina = reset ? 0 : paginaRef.current + 1;

      if (reset) {
        isRefresh ? setRefreshing(true) : setLoadingEstabelecimentos(true);
      } else {
        setLoadingMore(true);
      }
      setEstabelecimentosError('');

      try {
        const filtros = {
          ...coords,
          termo: termo || undefined,
          raioKm: raio * 1000,
          categorias: categoriasAtuais.length > 0 ? categoriasAtuais : undefined,
          estrelasMin: estrelas > 0 ? estrelas : undefined,
          ordenarPor: ordenacao,
        };

        const pages = {
          page: pagina,
          size: TAMANHO_PAGINA
        }

        const data = await findAllByCondition({ ...filtros, ...pages });
        const { content, last } = data.response;

        const formatted = content.map((e) => ({
          id: e.id,
          name: e.razaoSocial,
          category: e.tipo.descricao,
          distance: formatarDistancia(e.distanciaMetros),
          hours: 'Aberto até 22:00',
          rating: 4.8,
          reviews: 120,
          address: 'Rua das Acácias, 123 — Jardim Botânico, Londrina - PR',
          about:
            'Estrutura completa com equipamentos modernos e profissionais qualificados para te ajudar a alcançar seus objetivos.',
          amenities: ['Wi-Fi', 'Vestiário', 'Estacionamento', 'Ar-cond.'],
          image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
          coord: { top: '46%', left: '46%' },
        }));

        paginaRef.current = pagina;
        setHasMore(last === false);
        setEstabelecimentos((atual) => (reset ? formatted : [...atual, ...formatted]));

        if (reset) {
          setSelectedEstabelecimento((atualSelecionado) => {
            if (atualSelecionado && formatted.some((item) => item.id === atualSelecionado.id)) {
              return atualSelecionado;
            }
            return formatted[0] ?? null;
          });
        }
      } catch (err) {
        setEstabelecimentosError(
          err.friendlyMessage || 'Não foi possível carregar os estabelecimentos próximos.'
        );
      } finally {
        if (reset) {
          isRefresh ? setRefreshing(false) : setLoadingEstabelecimentos(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [coords, search, categorias, raioKm, estrelasMin, ordenarPor, loadingMore, hasMore]
  );

  // Busca inicial / toda vez que a localização mudar
  useEffect(() => {
    if (!coords) return;
    buscarEstabelecimentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  // Pull-to-refresh: sempre reseta a paginação
  const handleRefresh = useCallback(() => {
    buscarEstabelecimentos({ reset: true, isRefresh: true });
  }, [buscarEstabelecimentos]);

  // Infinite scroll: busca a próxima página, mantendo os filtros atuais
  const handleLoadMore = useCallback(() => {
    buscarEstabelecimentos({ reset: false });
  }, [buscarEstabelecimentos]);

  // Campo de busca por razão social: reseta a paginação
  const handleSubmitSearch = useCallback(() => {
    buscarEstabelecimentos({ reset: true });
  }, [buscarEstabelecimentos]);

  // Chip rápido de categoria (seleção única, na própria tela Explorar): reseta a paginação
  const handleSelectCategory = useCallback(
    (categoryId) => {
      const novasCategorias = categoryId === 'todos' ? [] : [categoryId];
      setCategorias(novasCategorias);
      buscarEstabelecimentos({ reset: true, categoriasOverride: novasCategorias });
    },
    [buscarEstabelecimentos]
  );

  // Abre a FiltersScreen levando os filtros atuais e recebe o resultado via onApply
  const handleOpenFilters = useCallback(() => {
    navigation.navigate('Filters', {
      initialFiltros: { categorias, raioKm, estrelasMin, ordenarPor },
      onApply: (novosFiltros) => {
        setCategorias(novosFiltros.categorias);
        setRaioKm(novosFiltros.raioKm);
        setEstrelasMin(novosFiltros.estrelasMin);
        setOrdenarPor(novosFiltros.ordenarPor);

        buscarEstabelecimentos({
          reset: true,
          categoriasOverride: novosFiltros.categorias,
          raioOverride: novosFiltros.raioKm,
          estrelasMinOverride: novosFiltros.estrelasMin,
          ordenarPorOverride: novosFiltros.ordenarPor,
        });
      },
    });
  }, [navigation, categorias, raioKm, estrelasMin, ordenarPor, buscarEstabelecimentos]);

  const isLoadingAnything = loadingLocation || loadingEstabelecimentos;

  // Chip ativo exibido na tela Explorar: só reflete seleção única simples.
  // Se a FiltersScreen aplicar múltiplas categorias, nenhum chip fica marcado.
  const activeCategory = categorias.length === 1 ? categorias[0] : 'todos';

  return (
    <Explore
      navigation={navigation}
      search={search}
      onChangeSearch={setSearch}
      onSubmitSearch={handleSubmitSearch}
      activeCategory={activeCategory}
      onSelectCategory={handleSelectCategory}
      raioKm={raioKm}
      onOpenFilters={handleOpenFilters}
      permissionDenied={permissionDenied}
      isLoadingAnything={isLoadingAnything}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onRetryLocation={refetchLocation}
      onRetryEstabelecimentos={() => buscarEstabelecimentos({ reset: true })}
      estabelecimentos={estabelecimentos}
      estabelecimentosError={estabelecimentosError}
      selectedEstabelecimento={selectedEstabelecimento}
      onSelectEstabelecimento={setSelectedEstabelecimento}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={handleLoadMore}
    />
  );
}