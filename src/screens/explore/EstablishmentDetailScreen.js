import { useState, useEffect, useCallback } from 'react';
import {
  findById,
  registrarInteresse,
  reportarProblema,
} from '../../services/estabelecimentoService';
import {
  listarPorEstabelecimento,
  adicionar as adicionarComentario,
} from '../../services/comentarioService';
import EstablishmentDetail from './EstablishmentDetail';

// Mesmos códigos de comodidade cadastrados no painel web (EstabelecimentoFormPage),
// mapeados pro rótulo e ícone exibidos aqui no app.
const AMENITY_META = {
  RESTROOM: { label: 'Banheiro', icon: 'body-outline' },
  PARKING: { label: 'Estacionamento', icon: 'car-outline' },
  WIFI: { label: 'Wi-Fi', icon: 'wifi-outline' },
  SHOWER: { label: 'Chuveiro', icon: 'water-outline' },
  LOCKERS: { label: 'Armários', icon: 'lock-closed-outline' },
  ACCESSIBLE_ACCESS: {
    label: 'Acesso p/ cadeirantes',
    icon: 'accessibility-outline',
  },
  BICYCLE_PARKING: { label: 'Bicicletário', icon: 'bicycle-outline' },
  AIR_CONDITIONING: { label: 'Ar-condicionado', icon: 'snow-outline' },
  DRINKING_FOUNTAIN: { label: 'Bebedouro', icon: 'water-outline' },
  CHANGING_ROOM: { label: 'Vestiário', icon: 'shirt-outline' },
  RECEPTION: { label: 'Recepção', icon: 'business-outline' },
  ELEVATOR: { label: 'Elevador', icon: 'swap-vertical-outline' },
};

function formatarEndereco(endereco) {
  if (!endereco) return '';
  const { logradouro, numero, bairro, cidade } = endereco;
  const linha1 = [logradouro, numero].filter(Boolean).join(', ');
  const cidadeTexto = cidade ? `${cidade.nome} - ${cidade.estado?.uf}` : '';
  return [linha1, bairro, cidadeTexto].filter(Boolean).join(' — ');
}

function formatarDataComentario(dataISO) {
  if (!dataISO) return '';
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatarHora(hora) {
  if (!hora) return '';
  return hora.slice(0, 5); // "06:00:00" -> "06:00"
}

/**
 * Monta o objeto final do estabelecimento a partir de duas fontes: o resumo
 * (já disponível na tela anterior) e o retorno do findById (detalhe
 * completo). Feito aqui mesmo, no tratamento da resposta.
 *
 * TODO: confirmar nomes exatos de "parceiro", "coberturaPlano" e
 * "interesseRegistrado" no payload real do backend — são os três campos
 * novos que ainda não existiam antes dessa tela ganhar essas seções.
 */
function montarEstabelecimento(gymResumo, e) {
  const horarioFuncionamento = e.horarioFuncionamento;
  return {
    ...gymResumo,
    id: e.id ?? gymResumo?.id,
    name: e.nomeFantasia || e.razaoSocial || gymResumo?.name,
    category: e.tipo.descricao,
    about: e.descricao,
    address: formatarEndereco(e.endereco),
    amenities: (e.comodidades || [])
      .map((item) => {
        const codigo = item?.codigo?.codigo ?? item?.codigo ?? item;
        const descricao = item?.codigo?.descricao ?? item?.descricao;
        if (!codigo) return null;
        return {
          label: descricao || AMENITY_META[codigo]?.label || codigo,
          icon: AMENITY_META[codigo]?.icon || 'checkmark-circle-outline',
        };
      })
      .filter(Boolean),
    website: e.website,
    instagram: e.instagram,
    horarioFuncionamento: horarioFuncionamento,
    hours: horarioFuncionamento
      ? horarioFuncionamento.aberto
        ? `Aberto até as ${formatarHora(horarioFuncionamento.horarioFechamento)}`
        : horarioFuncionamento.diaAbertura
          ? `Abre ${horarioFuncionamento.diaAbertura.descricao} às ${formatarHora(horarioFuncionamento.horarioAbertura)}`
          : 'Fechado'
      : null,
    rating: e.avaliacaoMedia,
    reviews: e.totalAvaliacoes,
    horarios: e.horarios || [],
    horariosExcecao: e.horariosExcecao || [],
    interesseRegistrado: e.interesseRegistrado ?? false,
    inclusoPlanoUsuario: e.inclusoPlanoUsuario,
    checkinHojeAutorizado: e.checkinHojeAutorizado,
    plano: e.plano ?? null,
    parceiro: e.parceiro,
  };
}

export default function EstablishmentDetailScreen({ route, navigation }) {
  const gymResumo = route.params?.gym ?? { id: route.params?.id };

  const [estabelecimento, setEstabelecimento] = useState(gymResumo);
  const [loadingDetalhes, setLoadingDetalhes] = useState(true);
  const [detalhesError, setDetalhesError] = useState('');

  const [registrandoInteresse, setRegistrandoInteresse] = useState(false);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportandoProblema, setReportandoProblema] = useState(false);
  const [reportError, setReportError] = useState('');

  const [comentarios, setComentarios] = useState([]);
  const [loadingComentarios, setLoadingComentarios] = useState(true);
  const [comentariosError, setComentariosError] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const buscarDetalhes = useCallback(async () => {
    if (!gymResumo?.id) return;

    setLoadingDetalhes(true);
    setDetalhesError('');
    try {
      // TODO: confirmar nome/formato exato do endpoint no backend
      const data = await findById(gymResumo.id);
      const e = data?.response ?? data;

      setEstabelecimento(montarEstabelecimento(gymResumo, e));
    } catch (err) {
      setDetalhesError(
        err.friendlyMessage ||
          'Não foi possível carregar os detalhes desse estabelecimento.'
      );
    } finally {
      setLoadingDetalhes(false);
    }
  }, [gymResumo]);

  const buscarComentarios = useCallback(async () => {
    if (!gymResumo?.id) return;

    setLoadingComentarios(true);
    setComentariosError('');
    try {
      // TODO: confirmar endpoint/formato exato no backend
      const data = await listarPorEstabelecimento(gymResumo.id);
      const lista = data?.response?.content ?? data?.response ?? [];

      setComentarios(
        lista.map((c) => ({
          id: c.id,
          autorNome: c.autor?.nome || c.autorNome || 'Usuário',
          texto: c.texto,
          dataFormatada: formatarDataComentario(c.data),
        }))
      );
    } catch (err) {
      setComentariosError(
        err.friendlyMessage || 'Não foi possível carregar os comentários.'
      );
    } finally {
      setLoadingComentarios(false);
    }
  }, [gymResumo]);

  useEffect(() => {
    buscarDetalhes();
    buscarComentarios();
  }, [buscarDetalhes, buscarComentarios]);

  const handleRegistrarInteresse = async () => {
    if (!estabelecimento?.id || estabelecimento.interesseRegistrado) return;

    setRegistrandoInteresse(true);
    try {
      // TODO: confirmar endpoint/formato exato — o backend decide se o
      // interesse foi registrado com sucesso e devolve a flag atualizada.
      const data = await registrarInteresse(estabelecimento.id);
      const registrado = data?.response?.interesseRegistrado ?? true;

      setEstabelecimento((atual) => ({
        ...atual,
        interesseRegistrado: registrado,
      }));
    } catch (_err) {
      // falha silenciosa por enquanto — o botão simplesmente volta ao estado normal
    } finally {
      setRegistrandoInteresse(false);
    }
  };

  const handleReportarProblema = async ({ motivo, descricao }) => {
    if (!estabelecimento?.id) return;

    setReportError('');
    setReportandoProblema(true);
    try {
      // TODO: confirmar endpoint/formato exato no backend
      await reportarProblema({
        estabelecimentoId: estabelecimento.id,
        motivo,
        descricao,
      });
      setReportModalVisible(false);
    } catch (err) {
      setReportError(
        err.friendlyMessage ||
          'Não foi possível enviar seu relato. Tente novamente.'
      );
    } finally {
      setReportandoProblema(false);
    }
  };

  const handleEnviarComentario = async (texto) => {
    if (!estabelecimento?.id) return;

    setEnviandoComentario(true);
    try {
      // TODO: confirmar endpoint/formato exato no backend
      const data = await adicionarComentario({
        estabelecimentoId: estabelecimento.id,
        texto,
      });
      const novoComentario = data?.response ?? data;

      setComentarios((atual) => [
        {
          id: novoComentario.id,
          autorNome:
            novoComentario.autor?.nome || novoComentario.autorNome || 'Você',
          texto: novoComentario.texto || texto,
          dataFormatada: formatarDataComentario(novoComentario.data) || 'agora',
        },
        ...atual,
      ]);
    } catch (_err) {
      // TODO: mostrar erro de envio de comentário (ex: toast) — por ora, falha silenciosa
    } finally {
      setEnviandoComentario(false);
    }
  };

  return (
    <EstablishmentDetail
      navigation={navigation}
      estabelecimento={estabelecimento}
      loadingDetalhes={loadingDetalhes}
      detalhesError={detalhesError}
      onRetryDetalhes={buscarDetalhes}
      onRegistrarInteresse={handleRegistrarInteresse}
      registrandoInteresse={registrandoInteresse}
      reportModalVisible={reportModalVisible}
      onOpenReportModal={() => setReportModalVisible(true)}
      onCloseReportModal={() => setReportModalVisible(false)}
      onReportarProblema={handleReportarProblema}
      reportandoProblema={reportandoProblema}
      reportError={reportError}
      comentarios={comentarios}
      loadingComentarios={loadingComentarios}
      comentariosError={comentariosError}
      onRetryComentarios={buscarComentarios}
      onEnviarComentario={handleEnviarComentario}
      enviandoComentario={enviandoComentario}
    />
  );
}
