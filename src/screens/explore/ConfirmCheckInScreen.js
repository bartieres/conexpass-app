import React, { useState, useEffect, useCallback } from 'react';
import { findAllByCondition } from '../../services/checkinService';
import { getResumo } from '../../services/assinaturaService';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import ConfirmCheckIn from './ConfirmCheckIn';

// Ordem de prioridade de uso: gasta primeiro o check-in do plano, depois
// avulso, depois bônus. Ajuste aqui se a regra de negócio for diferente
// (ou troque para vir pronta do backend, se ele já decidir isso).
function definirTipoUtilizado(resumo) {
  if (!resumo) return null;
  if (resumo.plano > 0) return 'Plano';
  if (resumo.avulso > 0) return 'Avulso';
  if (resumo.bonus > 0) return 'Bônus';
  return null;
}

/**
 * ConfirmCheckInScreen (container)
 * Aberta a partir do Detalhe do Estabelecimento. Busca quantos check-ins o
 * usuário tem disponíveis, decide qual tipo será usado, pega a localização
 * atual (usada pelo backend pra validar proximidade) e envia a confirmação.
 *
 * O componente visual (ConfirmCheckIn) só recebe dados e callbacks via props.
 */
export default function ConfirmCheckInScreen({ route, navigation }) {
  const estabelecimento = route?.params?.estabelecimento;

  const [resumo, setResumo] = useState(null);
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [resumoError, setResumoError] = useState('');

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Localização atual — enviada junto na confirmação pra o backend validar
  // que o usuário está de fato próximo ao estabelecimento.
  const { coords, loading: loadingLocation, permissionDenied, refetch: refetchLocation } = useCurrentLocation();

  const buscarResumo = useCallback(async () => {
    setLoadingResumo(true);
    setResumoError('');
    try {
      // TODO: confirmar endpoint/formato exato no backend
      const data = await getResumo();
      const { plano, qtdDisponivel, qtdAvulso, qtdBonus } = data.response;

      setResumo({
        disponiveis: qtdDisponivel ?? 0,
        plano: plano.nome ?? 0,
        avulso: qtdAvulso ?? 0,
        bonus: qtdBonus ?? 0,
      });
    } catch (err) {
      setResumoError(err.friendlyMessage || 'Não foi possível carregar seus check-ins disponíveis.');
    } finally {
      setLoadingResumo(false);
    }
  }, []);

  useEffect(() => {
    buscarResumo();
  }, [buscarResumo]);

  const tipoUtilizado = definirTipoUtilizado(resumo);

  const handleConfirmar = async () => {
    if (!tipoUtilizado || !coords) return;

    setConfirmError('');
    setConfirming(true);
    try {
      // TODO: confirmar contrato do endpoint (nomes dos campos, se tipo vai
      // como enum PLANO/AVULSO/BONUS, etc.)
      await checkinService.confirmar({
        estabelecimentoId: estabelecimento.id,
        tipo: tipoUtilizado,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      // Sucesso: volta pra tela de Check-ins, que já mostra o histórico atualizado
      navigation.navigate('CheckIns');
    } catch (err) {
      setConfirmError(err.friendlyMessage || 'Não foi possível confirmar seu check-in. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ConfirmCheckIn
      navigation={navigation}
      estabelecimento={estabelecimento}
      resumo={resumo}
      loadingResumo={loadingResumo}
      resumoError={resumoError}
      onRetryResumo={buscarResumo}
      tipoUtilizado={tipoUtilizado}
      loadingLocation={loadingLocation}
      permissionDenied={permissionDenied}
      onRetryLocation={refetchLocation}
      confirming={confirming}
      confirmError={confirmError}
      onConfirmar={handleConfirmar}
    />
  );
}