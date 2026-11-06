import { useState, useEffect, useCallback } from 'react';

// TODO: confirmar nome/path real do endpoint no backend — chutei um GET
// `consultarAcessoDisponivel(estabelecimentoId)` em algo como
// /checkins/acesso-disponivel?estabelecimentoId={id}, que já retorna qual
// plano/oferta será consumido (o backend decide a prioridade, não o app).
import { consultarAcessoDisponivel, solicitar } from '../../../services/checkinService';
import { useCurrentLocation } from '../../../hooks/useCurrentLocation';
import ConfirmCheckIn from './ConfirmCheckIn';

// Monta o objeto de acesso exibido na tela a partir do retorno do backend.
// `origemId`/`tipo` são guardados à parte (não exibidos) só pra reenviar
// exatamente como vieram na hora de confirmar o check-in.
function montarAcesso(a) {
  if (!a) return null;

  return {
    tipo: a.tipo, // { codigo, descricao } — ex: PLANO, OFERTA, AVULSO
    origemId: a.id ?? a.origemId,
    origem: a.origemDescricao
      ? { descricao: a.origemDescricao }
      : a.origem,

    nome: a.nome,
    disponiveis: a.disponiveis ?? a.qtdDisponivel,
    total: a.total ?? a.qtdTotal,
    consumira: a.consumira ?? 1,
    saldoApos:
      a.saldoApos ??
      (a.disponiveis != null ? a.disponiveis - (a.consumira ?? 1) : null),
    proximaRenovacao: a.proximaRenovacao,
  };
}

/**
 * ConfirmCheckInScreen (container)
 * Aberta a partir do Detalhe do Estabelecimento. Consulta no backend, com
 * base no estabelecimentoId, qual acesso (plano, oferta ou avulso) será
 * consumido nesse check-in — o app não decide a prioridade, só exibe o que
 * volta. Pega a localização atual (usada pelo backend pra validar
 * proximidade) e, ao confirmar, reenvia o estabelecimentoId junto com os
 * dados de origem do acesso recebidos na consulta, pro backend já saber
 * exatamente de onde descontar.
 *
 * O componente visual (ConfirmCheckIn) só recebe dados e callbacks via props.
 */
export default function ConfirmCheckInScreen({ route, navigation }) {
  const estabelecimento = route?.params?.estabelecimento;

  const [acesso, setAcesso] = useState(null);
  const [loadingAcesso, setLoadingAcesso] = useState(true);
  const [acessoError, setAcessoError] = useState('');

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Localização atual — enviada junto na confirmação pra o backend validar
  // que o usuário está de fato próximo ao estabelecimento.
  const {
    coords,
    loading: loadingLocation,
    permissionDenied,
    refetch: refetchLocation,
  } = useCurrentLocation();

  const buscarAcesso = useCallback(async () => {
    if (!estabelecimento?.id) {
      setLoadingAcesso(false);
      setAcessoError('Não foi possível identificar o estabelecimento.');
      return;
    }

    setLoadingAcesso(true);
    setAcessoError('');

    try {
      const data = await consultarAcessoDisponivel(estabelecimento.id);
      const a = data?.response ?? data;

      setAcesso(montarAcesso(a));
    } catch (err) {
      setAcessoError(
        err.friendlyMessage ||
          'Não foi possível verificar seu acesso disponível.'
      );
    } finally {
      setLoadingAcesso(false);
    }
  }, [estabelecimento]);

  useEffect(() => {
    buscarAcesso();
  }, [buscarAcesso]);

  const handleSolicitar = async () => {
    if (!acesso || !coords) return;

    setConfirmError('');
    setConfirming(true);

    try {
      const payload = {
        estabelecimento: {
          id: estabelecimento.id,
        },

        tipo: acesso.tipo?.codigo,
        origemId: acesso.origemId,

        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const data = await solicitar(payload);

      navigation.replace('CheckInPending', {
        checkinId: data?.response?.id,
        estabelecimento,
        acesso,
      });
    } catch (err) {
      setConfirmError(
        err.friendlyMessage ||
          'Não foi possível solicitar seu check-in. Tente novamente.'
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ConfirmCheckIn
      navigation={navigation}
      estabelecimento={estabelecimento}
      acesso={acesso}
      loadingAcesso={loadingAcesso}
      acessoError={acessoError}
      onRetryAcesso={buscarAcesso}
      loadingLocation={loadingLocation}
      permissionDenied={permissionDenied}
      onRetryLocation={refetchLocation}
      confirming={confirming}
      confirmError={confirmError}
      onSolicitar={handleSolicitar}
    />
  );
}
