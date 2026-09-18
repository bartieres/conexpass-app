import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { findAllByCondition } from '../../services/estabelecimentoService';
import { save as sugerirEstabelecimento } from '../../services/estabelecimentoLeadService';
import Explore from './Explore';

const RAIO_INICIAL_KM = 10;
const TAMANHO_PAGINA = 10;

export function formatarDistancia(distanciaMetros) {
  if (distanciaMetros < 1000) {
    return `${Math.round(distanciaMetros)} m`;
  }

  return `${(distanciaMetros / 1000).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

function formatarHora(hora) {
  if (!hora) return '';
  return hora.slice(0, 5); // "06:00:00" -> "06:00"
}

/**
 * ExploreScreen (container)
 * Responsável por: localização do usuário, busca de estabelecimentos no backend,
 * paginação (infinite scroll), estado de loading/erro, pull-to-refresh, todos
 * os filtros (texto, categorias — multi-seleção tanto pelos chips rápidos
 * quanto pela FiltersScreen) e o modal de "indicar estabelecimento".
 *
 * O componente visual (Explore) só recebe dados e callbacks via props.
 */
export default function ExploreScreen({ navigation, route }) {
  const [search, setSearch] = useState('');

  // Filtros completos. "categorias" é sempre um array — tanto os chips
  // rápidos quanto a FiltersScreen escrevem/leem o mesmo estado, então os
  // dois lugares ficam sempre sincronizados entre si.
  const [categorias, setCategorias] = useState([]); // [] = "todos"
  const [raioKm, setRaioKm] = useState(RAIO_INICIAL_KM);
  const [estrelasMin, setEstrelasMin] = useState(0);
  const [ordenarPor, setOrdenarPor] = useState('distancia');

  // Localização do usuário
  const {
    coords,
    loading: loadingLocation,
    permissionDenied,
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

  // Modal "Não encontrou o estabelecimento que procura?"
  const [suggestModalVisible, setSuggestModalVisible] = useState(false);
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  const [suggestionSuccess, setSuggestionSuccess] = useState(false);

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
      const categoriasFiltradas = categoriasAtuais.includes('TODOS')
        ? undefined
        : categoriasAtuais;
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
          tipos:
            categoriasFiltradas && categoriasFiltradas.length > 0
              ? categoriasFiltradas
              : undefined,
          //estrelasMin: estrelas > 0 ? estrelas : undefined,
          //ordenarPor: ordenacao,
        };

        const pages = {
          page: pagina,
          size: TAMANHO_PAGINA,
        };

        const data = await findAllByCondition({ ...filtros, ...pages });
        const { content, last } = data.response;

        const formatted = content.map((e) => {
          const horarioFuncionamento = e.horarioFuncionamento;
          return {
            id: e.id,
            name: e.razaoSocial,
            category: e.tipo.descricao,
            distance: formatarDistancia(e.distanciaMetros),
            parceiro: e.parceiro,
            hours:
              e.parceiro !== false && horarioFuncionamento
                ? horarioFuncionamento.aberto
                  ? `Aberto até as ${formatarHora(
                      horarioFuncionamento.horarioFechamento
                    )}`
                  : horarioFuncionamento.diaAbertura
                    ? `Abre ${
                        horarioFuncionamento.diaAbertura.descricao
                      } às ${formatarHora(
                        horarioFuncionamento.horarioAbertura
                      )}`
                    : 'Fechado'
                : null,
            checkinHoje: e.checkinRealizadoHoje ?? false, // implementar flag que indica se fez checkin hoje
            //reviews: 120,
            image:
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
            //coord: { top: '46%', left: '46%' },
          };
        });

        paginaRef.current = pagina;
        setHasMore(last === false);
        setEstabelecimentos((atual) =>
          reset ? formatted : [...atual, ...formatted]
        );

        if (reset) {
          setSelectedEstabelecimento((atualSelecionado) => {
            if (
              atualSelecionado &&
              formatted.some((item) => item.id === atualSelecionado.id)
            ) {
              return atualSelecionado;
            }
            return formatted[0] ?? null;
          });
        }
      } catch (err) {
        setEstabelecimentosError(
          err.friendlyMessage ||
            'Não foi possível carregar os estabelecimentos próximos.'
        );
      } finally {
        if (reset) {
          isRefresh ? setRefreshing(false) : setLoadingEstabelecimentos(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [
      coords,
      search,
      categorias,
      raioKm,
      estrelasMin,
      ordenarPor,
      loadingMore,
      hasMore,
    ]
  );

  // Busca inicial / toda vez que a localização mudar
  useEffect(() => {
    if (!coords) return;
    buscarEstabelecimentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  // Recebe os filtros de volta da FiltersScreen via route.params (nunca via
  // função — funções não são serializáveis no estado de navegação e geram o
  // aviso "Non-serializable values were found in the navigation state").
  useEffect(() => {
    const filtrosAplicados = route?.params?.filtrosAplicados;
    if (!filtrosAplicados) return;

    setCategorias(filtrosAplicados.categorias ?? []);
    setRaioKm(filtrosAplicados.raioKm ?? RAIO_INICIAL_KM);
    setEstrelasMin(filtrosAplicados.estrelasMin ?? 0);
    setOrdenarPor(filtrosAplicados.ordenarPor ?? 'distancia');

    buscarEstabelecimentos({
      reset: true,
      categoriasOverride: filtrosAplicados.categorias ?? [],
      raioOverride: filtrosAplicados.raioKm ?? RAIO_INICIAL_KM,
      estrelasMinOverride: filtrosAplicados.estrelasMin ?? 0,
      ordenarPorOverride: filtrosAplicados.ordenarPor ?? 'distancia',
    });

    navigation.setParams({ filtrosAplicados: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.filtrosAplicados]);

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

  // Chip rápido de categoria: agora é multi-seleção (toggle), igual à
  // FiltersScreen — tocar em "todos" limpa a seleção; tocar numa categoria já
  // marcada remove ela; tocar numa não marcada adiciona.
  const handleSelectCategory = useCallback(
    (categoryId) => {
      let novasCategorias;
      if (categoryId === 'todos') {
        novasCategorias = [];
      } else if (categorias.includes(categoryId)) {
        novasCategorias = categorias.filter((c) => c !== categoryId);
      } else {
        novasCategorias = [...categorias, categoryId];
      }

      setCategorias(novasCategorias);
      buscarEstabelecimentos({
        reset: true,
        categoriasOverride: novasCategorias,
      });
    },
    [categorias, buscarEstabelecimentos]
  );

  // Abre a FiltersScreen levando os filtros atuais. A resposta volta via
  // route.params (ver useEffect acima), não via callback.
  const handleOpenFilters = useCallback(() => {
    navigation.navigate('Filters', {
      initialFiltros: { categorias, raioKm, estrelasMin, ordenarPor },
    });
  }, [navigation, categorias, raioKm, estrelasMin, ordenarPor]);

  // Modal "Não encontrou o estabelecimento que procura?"
  const handleOpenSuggestModal = useCallback(() => {
    setSuggestionError('');
    setSuggestionSuccess(false);
    setSuggestModalVisible(true);
  }, []);

  const handleCloseSuggestModal = useCallback(() => {
    setSuggestModalVisible(false);
  }, []);

  const handleSubmitSuggestEstablishment = useCallback(async (dados) => {
    setSendingSuggestion(true);
    setSuggestionError('');
    try {
      await sugerirEstabelecimento(dados);
      setSuggestionSuccess(true);
    } catch (err) {
      setSuggestionError(
        err.friendlyMessage ||
          'Não foi possível enviar sua indicação. Tente novamente.'
      );
    } finally {
      setSendingSuggestion(false);
    }
  }, []);

  const isLoadingAnything = loadingLocation || loadingEstabelecimentos;

  return (
    <Explore
      navigation={navigation}
      search={search}
      onChangeSearch={setSearch}
      onSubmitSearch={handleSubmitSearch}
      categoriasSelecionadas={categorias}
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
      suggestModalVisible={suggestModalVisible}
      onOpenSuggestModal={handleOpenSuggestModal}
      onCloseSuggestModal={handleCloseSuggestModal}
      onSubmitSuggestEstablishment={handleSubmitSuggestEstablishment}
      sendingSuggestion={sendingSuggestion}
      suggestionError={suggestionError}
      suggestionSuccess={suggestionSuccess}
    />
  );
}
