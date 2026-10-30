import { useState, useCallback, useEffect, useMemo } from 'react';

import { findById } from '../../../services/estabelecimentoOfertaService';

import OfertaDetail from './OfertaDetail';

function montarOferta(ofertaResumo, estabelecimentoResumo, o) {
  return {
    ...ofertaResumo,
    id: o.id ?? ofertaResumo?.id,
    nome: o.nome ?? ofertaResumo?.nome,
    descricao: o.descricao ?? ofertaResumo?.descricao,
    tipo: o.tipo ?? ofertaResumo?.tipo,
    valor: o.valor ?? ofertaResumo?.valor,
    valorPromocional: o.valorPromocional ?? ofertaResumo?.valorPromocional,
    beneficios: o.beneficios || [],
    condicoes: o.condicoes || [],
    informacoesImportantes: o.informacoesImportantes || [],
    estabelecimento: {
      id: estabelecimentoResumo?.id,
      name: estabelecimentoResumo?.name,
      category: estabelecimentoResumo?.category,
      image: estabelecimentoResumo?.image,
      rating: estabelecimentoResumo?.rating,
      reviews: estabelecimentoResumo?.reviews,
      distance: estabelecimentoResumo?.distance,
      cidade: estabelecimentoResumo?.cidade,
    },
  };
}

export default function OfertaDetailScreen({ route, navigation }) {
  const ofertaResumo = useMemo(
    () => route.params?.ofertaResumo ?? { id: route.params?.ofertaId },
    [route.params?.ofertaResumo, route.params?.ofertaId]
  );
  const estabelecimentoResumo = route.params?.estabelecimento;

  const [oferta, setOferta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const obterOferta = useCallback(async () => {
    if (!ofertaResumo?.id || !estabelecimentoResumo?.id) {
      throw new Error('Não foi possível identificar a oferta.');
    }

    const data = await findById(estabelecimentoResumo.id, ofertaResumo.id);
    const o = data?.response ?? data;

    return montarOferta(ofertaResumo, estabelecimentoResumo, o);
  }, [ofertaResumo, estabelecimentoResumo]);

  const buscarOferta = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setOferta(await obterOferta());
    } catch (err) {
      setError(
        err.friendlyMessage ||
          err.message ||
          'Não foi possível carregar os detalhes dessa oferta.'
      );
    } finally {
      setLoading(false);
    }
  }, [obterOferta]);

  useEffect(() => {
    let ativo = true;

    async function carregarOfertaInicial() {
      try {
        const ofertaCarregada = await obterOferta();

        if (ativo) setOferta(ofertaCarregada);
      } catch (err) {
        if (ativo) {
          setError(
            err.friendlyMessage ||
              err.message ||
              'Não foi possível carregar os detalhes dessa oferta.'
          );
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarOfertaInicial();

    return () => {
      ativo = false;
    };
  }, [obterOferta]);

  const handleContratar = () => {
    if (!oferta?.id) return;

    navigation.navigate('EstabelecimentoOfertaCheckout', {
      oferta,
    });
  };

  return (
    <OfertaDetail
      navigation={navigation}
      oferta={oferta}
      loading={loading}
      error={error}
      onRetry={buscarOferta}
      onContratar={handleContratar}
    />
  );
}
