import { useState, useCallback, useEffect } from 'react';

import { findById } from '../../../services/estabelecimentoOfertaService';

import OfertaDetail from './OfertaDetail';

// Monta o objeto final da oferta mesclando o resumo recebido da listagem
// (nome, tipo, valor — já exibidos na tela anterior) com o detalhe vindo
// do findById (benefícios, condições, informações importantes), seguindo
// o mesmo padrão usado em EstablishmentDetailScreen.
function montarOferta(ofertaResumo, estabelecimentoResumo, o) {
  return {
    ...ofertaResumo,
    id: o.id ?? ofertaResumo?.id,
    nome: o.nome ?? ofertaResumo?.nome,
    descricao: o.descricao ?? ofertaResumo?.descricao,
    tipo: o.tipo ?? ofertaResumo?.tipo,
    valor: o.valor ?? ofertaResumo?.valor,
    periodicidade: o.periodicidade ?? ofertaResumo?.periodicidade,

    // TODO: confirmar os nomes desses campos com o backend — chutei
    // `beneficios` (lista de strings), `condicoes` (lista de
    // { label, valor }) e `informacoesImportantes` (lista de strings),
    // já que o conteúdo varia bastante entre plano/pacote/avulso.
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
  const ofertaResumo = route.params?.ofertaResumo ?? {
    id: route.params?.ofertaId,
  };
  const estabelecimentoResumo = route.params?.estabelecimento;

  const [oferta, setOferta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscarOferta = useCallback(async () => {
    if (!ofertaResumo?.id || !estabelecimentoResumo?.id) {
      setLoading(false);
      setError('Não foi possível identificar a oferta.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await findById(estabelecimentoResumo.id, ofertaResumo.id);
      const o = data?.response ?? data;

      setOferta(montarOferta(ofertaResumo, estabelecimentoResumo, o));
    } catch (err) {
      setError(
        err.friendlyMessage ||
          'Não foi possível carregar os detalhes dessa oferta.'
      );
    } finally {
      setLoading(false);
    }
  }, [ofertaResumo, estabelecimentoResumo]);

  useEffect(() => {
    buscarOferta();
  }, [buscarOferta]);

  // Não contrata direto daqui — leva pro resumo da contratação, que por
  // sua vez leva pra tela de pagamento. Mesmo padrão em dois passos já
  // usado em ChangePlanScreen -> ChangePlanCheckoutScreen.
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
