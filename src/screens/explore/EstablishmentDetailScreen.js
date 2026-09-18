import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import {
  findById,
  registrarInteresse,
} from '../../services/estabelecimentoService';

import {
  reportarProblema,
} from '../../services/reporteProblemaService';

import {
  listarPorEstabelecimento,
  adicionar as adicionarComentario,
} from '../../services/comentarioService';

import EstablishmentDetail from './EstablishmentDetail';

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
  AIR_CONDITIONING: {
    label: 'Ar-condicionado',
    icon: 'snow-outline',
  },
  DRINKING_FOUNTAIN: {
    label: 'Bebedouro',
    icon: 'water-outline',
  },
  CHANGING_ROOM: {
    label: 'Vestiário',
    icon: 'shirt-outline',
  },
  RECEPTION: {
    label: 'Recepção',
    icon: 'business-outline',
  },
  ELEVATOR: {
    label: 'Elevador',
    icon: 'swap-vertical-outline',
  },
};

function formatarEndereco(endereco) {
  if (!endereco) return '';

  const {
    logradouro,
    numero,
    bairro,
    cidade,
  } = endereco;

  const linha1 = [logradouro, numero]
    .filter(Boolean)
    .join(', ');

  const cidadeTexto = cidade
    ? `${cidade.nome} - ${cidade.estado?.uf}`
    : '';

  return [
    linha1,
    bairro,
    cidadeTexto,
  ]
    .filter(Boolean)
    .join(' — ');
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

  return hora.slice(0, 5);
}

function montarEstabelecimento(gymResumo, e) {
  const horarioFuncionamento = e.horarioFuncionamento;

  return {
    ...gymResumo,

    id: e.id ?? gymResumo?.id,

    name:
      e.nomeFantasia ||
      e.razaoSocial ||
      gymResumo?.name,

    category: e.tipo?.descricao,

    about: e.descricao,

    address: formatarEndereco(e.endereco),

    amenities: (e.comodidades || [])
      .map((item) => {
        const codigo =
          item?.codigo?.codigo ??
          item?.codigo ??
          item;

        const descricao =
          item?.codigo?.descricao ??
          item?.descricao;

        if (!codigo) return null;

        return {
          label:
            descricao ||
            AMENITY_META[codigo]?.label ||
            codigo,

          icon:
            AMENITY_META[codigo]?.icon ||
            'checkmark-circle-outline',
        };
      })
      .filter(Boolean),

    website: e.website,

    instagram: e.instagram,

    horarioFuncionamento,

    hours: horarioFuncionamento
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

    rating: e.avaliacaoMedia,

    reviews: e.totalAvaliacoes,

    horarios: e.horarios || [],

    horariosExcecao: e.horariosExcecao || [],

    usuarioPossuiInteresse: e.usuarioPossuiInteresse ?? false,
    totalInteresses: e.totalInteresses ?? 0,
    inclusoPlanoUsuario:
      e.inclusoPlanoUsuario,

    checkinHojeAutorizado:
      e.checkinHojeAutorizado,

    plano: e.plano ?? null,

    parceiro: e.parceiro,
  };
}

export default function EstablishmentDetailScreen({
  route,
  navigation,
}) {
  const gymResumo =
    route.params?.gym ?? {
      id: route.params?.id,
    };

  // IMPORTANTE:
  // começa null. O resumo da tela anterior NÃO é exibido
  // como detalhe.
  const [estabelecimento, setEstabelecimento] =
    useState(null);

  const [loadingDetalhes, setLoadingDetalhes] =
    useState(true);

  const [detalhesError, setDetalhesError] =
    useState('');

  const [registrandoInteresse, setRegistrandoInteresse] =
    useState(false);

  const [reportModalVisible, setReportModalVisible] =
    useState(false);

  const [reportandoProblema, setReportandoProblema] =
    useState(false);

  const [reportError, setReportError] =
    useState('');

  const [comentarios, setComentarios] =
    useState([]);

  const [loadingComentarios, setLoadingComentarios] =
    useState(true);

  const [comentariosError, setComentariosError] =
    useState('');

  const [enviandoComentario, setEnviandoComentario] =
    useState(false);

  const buscarDetalhes = useCallback(async () => {
    if (!gymResumo?.id) {
      setLoadingDetalhes(false);
      setDetalhesError(
        'Não foi possível identificar o estabelecimento.'
      );
      return;
    }

    setLoadingDetalhes(true);
    setDetalhesError('');

    // Evita manter dados antigos enquanto faz uma nova busca.
    setEstabelecimento(null);

    try {
      const data = await findById(gymResumo.id);

      const e = data?.response ?? data;

      const estabelecimentoCompleto =
        montarEstabelecimento(
          gymResumo,
          e
        );

      setEstabelecimento(
        estabelecimentoCompleto
      );
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
      const data =
        await listarPorEstabelecimento(
          gymResumo.id
        );

      const lista =
        data?.response?.content ??
        data?.response ??
        [];

      setComentarios(
        lista.map((c) => ({
          id: c.id,
          autorNome:
            c.autor?.nome ||
            c.autorNome ||
            'Usuário',
          texto: c.texto,
          dataFormatada:
            formatarDataComentario(c.data),
        }))
      );
    } catch (err) {
      setComentariosError(
        err.friendlyMessage ||
          'Não foi possível carregar os comentários.'
      );
    } finally {
      setLoadingComentarios(false);
    }
  }, [gymResumo]);

  useEffect(() => {
    buscarDetalhes();
    buscarComentarios();
  }, [
    buscarDetalhes,
    buscarComentarios,
  ]);

  const handleRegistrarInteresse = async () => {
    if (
      !estabelecimento?.id ||
      estabelecimento.usuarioPossuiInteresse
    ) {
      return;
    }

    setRegistrandoInteresse(true);

    try {
      const payload = {
        estabelecimento: {
          id: estabelecimento.id,
        },
      };

      const data =
        await registrarInteresse(payload);

      const registrado =
        data?.response
          ?.usuarioPossuiInteresse ?? true;

      setEstabelecimento((atual) => ({
        ...atual,
        usuarioPossuiInteresse: registrado,
        totalInteresses: registrado
          ? (atual.totalInteresses ?? 0) + 1
          : atual.totalInteresses,
      }));
    } catch (_err) {
      // falha silenciosa por enquanto
    } finally {
      setRegistrandoInteresse(false);
    }
  };

  const handleReportarProblema = async ({
    motivo,
    descricao,
  }) => {
    if (!estabelecimento?.id) return;

    setReportError('');
    setReportandoProblema(true);

    try {
      const payload = {
        estabelecimento: {
          id: estabelecimento.id,
        },
        motivo,
        descricao,
      };

      await reportarProblema(payload);
    } catch (err) {
      setReportError(
        err.friendlyMessage ||
          'Não foi possível enviar seu relato. Tente novamente.'
      );

      throw err;
    } finally {
      setReportandoProblema(false);
    }
  };

  const handleEnviarComentario = async (texto) => {
    if (!estabelecimento?.id) return;

    setEnviandoComentario(true);

    try {
      const data =
        await adicionarComentario({
          estabelecimentoId:
            estabelecimento.id,
          texto,
        });

      const novoComentario =
        data?.response ?? data;

      setComentarios((atual) => [
        {
          id: novoComentario.id,
          autorNome:
            novoComentario.autor?.nome ||
            novoComentario.autorNome ||
            'Você',
          texto:
            novoComentario.texto ||
            texto,
          dataFormatada:
            formatarDataComentario(
              novoComentario.data
            ) || 'agora',
        },
        ...atual,
      ]);
    } catch (_err) {
      // falha silenciosa por enquanto
    } finally {
      setEnviandoComentario(false);
    }
  };

  /*
   * ============================================================
   * IMPORTANTE
   * ============================================================
   *
   * Enquanto o findById estiver carregando, NÃO renderizamos
   * EstablishmentDetail.
   *
   * O gymResumo recebido da tela anterior não é exibido.
   */

  if (loadingDetalhes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Carregando estabelecimento...
        </Text>
      </View>
    );
  }

  /*
   * Se o findById terminou mas ocorreu erro,
   * mostramos somente a tela de erro.
   */
  if (detalhesError || !estabelecimento) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color="#DC2626"
        />

        <Text style={styles.errorTitle}>
          Não foi possível carregar o estabelecimento
        </Text>

        {!!detalhesError && (
          <Text style={styles.errorMessage}>
            {detalhesError}
          </Text>
        )}

        <TouchableOpacity
          style={styles.retryButton}
          onPress={buscarDetalhes}
          activeOpacity={0.85}
        >
          <Text style={styles.retryButtonText}>
            Tentar novamente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /*
   * Só chega aqui depois que o findById terminou
   * e estabelecimento foi preenchido com os dados
   * completos.
   */
  return (
    <EstablishmentDetail
      navigation={navigation}
      estabelecimento={estabelecimento}

      loadingDetalhes={false}
      detalhesError=""
      onRetryDetalhes={buscarDetalhes}

      onRegistrarInteresse={
        handleRegistrarInteresse
      }
      registrandoInteresse={
        registrandoInteresse
      }

      reportModalVisible={
        reportModalVisible
      }

      onOpenReportModal={() =>
        setReportModalVisible(true)
      }

      onCloseReportModal={() =>
        setReportModalVisible(false)
      }

      onReportarProblema={
        handleReportarProblema
      }

      reportandoProblema={
        reportandoProblema
      }

      reportError={reportError}

      comentarios={comentarios}
      loadingComentarios={
        loadingComentarios
      }
      comentariosError={
        comentariosError
      }

      onRetryComentarios={
        buscarComentarios
      }

      onEnviarComentario={
        handleEnviarComentario
      }

      enviandoComentario={
        enviandoComentario
      }
    />
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#6B7280',
  },

  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  backButton: {
    marginTop: 14,
    padding: 10,
  },

  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
};
