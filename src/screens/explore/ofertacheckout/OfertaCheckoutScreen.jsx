import { useCallback, useMemo } from 'react';

import OfertaCheckout from './OfertaCheckout';

export default function OfertaCheckoutScreen({ route, navigation }) {
  const oferta = route.params?.oferta;

  const resumo = useMemo(() => {
    if (!oferta) return null;

    const tipo = oferta.tipo?.codigo;

    const condicoes = oferta.condicoes || [];

    const buscarCondicao = (label) =>
      condicoes.find(
        (item) =>
          item.label?.toLowerCase() === label.toLowerCase()
      )?.valor;

    return {
      id: oferta.id,
      nome: oferta.nome,
      descricao: oferta.descricao,
      tipo: oferta.tipo,
      valor: oferta.valor,
      periodicidade: oferta.periodicidade,

      estabelecimento: oferta.estabelecimento,

      quantidadeAcessos: buscarCondicao(
        'Quantidade de acessos'
      ),

      validade: buscarCondicao(
        'Validade dos acessos'
      ),

      modalidades: buscarCondicao(
        'Modalidades incluídas'
      ),

      cobranca: buscarCondicao('Cobrança'),

      recorrente: tipo === 'RECORRENTE',
    };
  }, [oferta]);

  const handleContinuar = useCallback(() => {
    if (!resumo?.id) return;

    navigation.navigate('EstabelecimentoOfertaPagamento', {
      oferta,
    });
  }, [navigation, oferta, resumo]);

  return (
    <OfertaCheckout
      navigation={navigation}
      resumo={resumo}
      onContinuar={handleContinuar}
    />
  );
}
