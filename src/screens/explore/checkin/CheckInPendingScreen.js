import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../../theme/theme';
import { getStatus, cancelar } from '../../../services/checkinService';

const INTERVALO_POLLING_MS = 3000; // pergunta ao backend a cada 3s
const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos esperando sem resposta

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * CheckInPendingScreen
 *
 * Fica aberta enquanto o check-in está com status PENDENTE, fazendo polling
 * no backend até a recepção do estabelecimento aprovar ou recusar. Isso
 * existe porque "salvou no banco" não é o mesmo que "confirmado" — a
 * confirmação de verdade depende de uma ação humana do outro lado (o
 * atendente no painel web).
 *
 * route.params esperado: { checkinId, estabelecimento, acesso }
 * `acesso` é o mesmo objeto já consultado/exibido na tela de confirmação
 * (ConfirmCheckInScreen) — reaproveitado aqui só pra exibição, não é
 * buscado de novo.
 */
export default function CheckInPendingScreen({ route, navigation }) {
  const { checkinId, estabelecimento, acesso } = route?.params ?? {};

  // 'aguardando' | 'confirmado' | 'recusado' | 'expirado' | 'erro'
  const [status, setStatus] = useState('aguardando');
  const [erro, setErro] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [verificandoAgora, setVerificandoAgora] = useState(false);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const emVooRef = useRef(false); // evita sobrepor duas checagens se uma demorar mais que o intervalo

  const rotate = useRef(new Animated.Value(0)).current;

  // Animação de "rodando" no ícone do relógio, só de feedback visual
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rotate]);

  const pararPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const checarStatus = useCallback(async () => {
    if (emVooRef.current) return;
    emVooRef.current = true;
    try {
      // TODO: confirmar formato exato da resposta — assumindo
      // { situacao: { codigo: 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO' } }
      const data = await getStatus(checkinId);
      const codigo = data.response.situacao?.codigo;

      if (codigo === 'CONFIRMADO') {
        pararPolling();
        setStatus('confirmado');
        navigation.replace('CheckInSuccess', { estabelecimento });
      } else if (codigo === 'RECUSADO' || codigo === 'CANCELADO') {
        pararPolling();
        setStatus('recusado');
      }
      // se ainda for PENDENTE, não faz nada — só espera a próxima checagem
    } catch (err) {
      // erro de rede pontual não derruba o fluxo — só tenta de novo no próximo ciclo
      console.warn('Falha ao checar status do check-in:', err);
    } finally {
      emVooRef.current = false;
    }
  }, [checkinId, estabelecimento, navigation, pararPolling]);

  useEffect(() => {
    if (!checkinId) {
      setStatus('erro');
      setErro('Não foi possível identificar o check-in.');
      return;
    }

    // primeira checagem imediata, depois em intervalos regulares
    checarStatus();
    intervalRef.current = setInterval(checarStatus, INTERVALO_POLLING_MS);

    // se passar do tempo limite sem resposta, para o polling e avisa o usuário
    timeoutRef.current = setTimeout(() => {
      pararPolling();
      setStatus((atual) => (atual === 'aguardando' ? 'expirado' : atual));
    }, TIMEOUT_MS);

    return pararPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkinId]);

  const handleContinuarAguardando = () => {
    setStatus('aguardando');
    checarStatus();
    intervalRef.current = setInterval(checarStatus, INTERVALO_POLLING_MS);
    timeoutRef.current = setTimeout(() => {
      pararPolling();
      setStatus((atual) => (atual === 'aguardando' ? 'expirado' : atual));
    }, TIMEOUT_MS);
  };

  // Checagem manual, disparada pelo botão "Acompanhar solicitação" — o
  // polling automático continua rodando normalmente, isso só adianta a
  // resposta pra quem não quer esperar o próximo ciclo de 3s.
  const handleAcompanhar = async () => {
    setVerificandoAgora(true);
    try {
      await checarStatus();
    } finally {
      setVerificandoAgora(false);
    }
  };

  const handleCancelar = () => {
    Alert.alert(
      'Cancelar check-in',
      'Deseja cancelar essa solicitação de check-in?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            pararPolling();
            setCancelando(true);
            try {
              const payload = {
                id: checkinId,
                observacao: 'Check-in cancelado pelo Usuário',
              };

              await cancelar(payload);
            } catch (_err) {
              // mesmo se falhar o cancelamento no backend, deixa o usuário sair da tela
            } finally {
              setCancelando(false);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const mostrarResumo =
    (status === 'aguardando' || status === 'expirado') &&
    (!!estabelecimento || !!acesso);

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in solicitado</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusBlock}>
          {status === 'aguardando' && (
            <>
              <Animated.View
                style={[
                  styles.iconCircle,
                  { transform: [{ rotate: rotateInterpolate }] },
                ]}
              >
                <Ionicons name="time-outline" size={40} color="#fff" />
              </Animated.View>
              <Text style={styles.title}>Aguardando confirmação</Text>
              <Text style={styles.subtitle}>
                Seu check-in foi enviado para a
                {!!estabelecimento?.name && ` ${estabelecimento.name}`} e está
                aguardando análise.
              </Text>
            </>
          )}

          {status === 'recusado' && (
            <>
              <View style={[styles.iconCircle, styles.iconCircleError]}>
                <Ionicons name="close" size={40} color="#fff" />
              </View>
              <Text style={styles.title}>Check-in não aprovado</Text>
              <Text style={styles.subtitle}>
                A recepção não confirmou sua solicitação. Verifique com o
                estabelecimento ou tente novamente.
              </Text>
            </>
          )}

          {status === 'expirado' && (
            <>
              <View style={[styles.iconCircle, styles.iconCircleWarning]}>
                <Ionicons name="alert" size={38} color="#fff" />
              </View>
              <Text style={styles.title}>Ainda sem resposta</Text>
              <Text style={styles.subtitle}>
                A recepção ainda não confirmou sua solicitação. Você pode
                continuar aguardando ou cancelar.
              </Text>
            </>
          )}

          {status === 'erro' && (
            <>
              <View style={[styles.iconCircle, styles.iconCircleError]}>
                <Ionicons name="alert-circle-outline" size={38} color="#fff" />
              </View>
              <Text style={styles.title}>Algo deu errado</Text>
              <Text style={styles.subtitle}>{erro}</Text>
            </>
          )}
        </View>

        {mostrarResumo && (
          <>
            {!!estabelecimento && (
              <View style={styles.gymCard}>
                {estabelecimento.image ? (
                  <Image
                    source={{ uri: estabelecimento.image }}
                    style={styles.gymImage}
                  />
                ) : (
                  <View style={styles.gymIconWrap}>
                    <Ionicons
                      name="barbell-outline"
                      size={26}
                      color={colors.blue}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.gymName}>{estabelecimento.name}</Text>
                  {!!estabelecimento.category && (
                    <Text style={styles.gymCategory} numberOfLines={1}>
                      {estabelecimento.category}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {!!acesso && (
              <View style={styles.acessoCard}>
                <View style={styles.acessoTopRow}>
                  <View style={styles.acessoIconWrap}>
                    <Ionicons
                      name="barbell-outline"
                      size={20}
                      color={colors.blue}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.acessoNome} numberOfLines={1}>
                      {acesso.nome}
                    </Text>
                    <Text style={styles.acessoSubtitulo}>
                      Utilização do seu saldo
                    </Text>
                  </View>
                  {!!acesso.origem?.descricao && (
                    <View style={styles.origemPill}>
                      <Text style={styles.origemPillText} numberOfLines={1}>
                        {acesso.origem.descricao}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.acessoInfoRows}>
                  <View style={styles.acessoInfoRow}>
                    <View style={styles.acessoInfoLeft}>
                      <Ionicons
                        name="layers-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                      <Text style={styles.acessoInfoLabel}>
                        Consumo solicitado
                      </Text>
                    </View>
                    <Text style={styles.acessoInfoValue}>
                      {acesso.consumira ?? 1} acesso
                      {(acesso.consumira ?? 1) > 1 ? 's' : ''}
                    </Text>
                  </View>

                  {acesso.saldoApos != null && (
                    <View
                      style={[styles.acessoInfoRow, styles.acessoInfoRowDivider]}
                    >
                      <View style={styles.acessoInfoLeft}>
                        <Ionicons
                          name="sync-outline"
                          size={16}
                          color={colors.textMuted}
                        />
                        <Text style={styles.acessoInfoLabel}>
                          Saldo após confirmação
                        </Text>
                      </View>
                      <Text style={styles.acessoInfoValue}>
                        {acesso.saldoApos} acesso
                        {acesso.saldoApos !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}

                  {!!acesso.proximaRenovacao && (
                    <View
                      style={[styles.acessoInfoRow, styles.acessoInfoRowDivider]}
                    >
                      <View style={styles.acessoInfoLeft}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={colors.textMuted}
                        />
                        <Text style={styles.acessoInfoLabel}>
                          Próxima renovação
                        </Text>
                      </View>
                      <Text style={styles.acessoInfoValue}>
                        {formatarData(acesso.proximaRenovacao)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {status === 'aguardando' && (
          <>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={handleAcompanhar}
              disabled={verificandoAgora}
            >
              <Text style={styles.outlineButtonText}>
                {verificandoAgora ? 'Verificando...' : 'Acompanhar solicitação'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancelar}
              disabled={cancelando}
            >
              <Text style={styles.secondaryButtonText}>
                {cancelando ? 'Cancelando...' : 'Cancelar solicitação'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'expirado' && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinuarAguardando}
            >
              <Text style={styles.primaryButtonText}>Continuar aguardando</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancelar}
              disabled={cancelando}
            >
              <Text style={styles.secondaryButtonText}>
                {cancelando ? 'Cancelando...' : 'Cancelar'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {(status === 'recusado' || status === 'erro') && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },

  content: { padding: 20, paddingTop: 10, paddingBottom: 30 },

  statusBlock: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 22,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...shadow,
  },
  iconCircleError: { backgroundColor: '#DC2626' },
  iconCircleWarning: { backgroundColor: '#B45309' },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },

  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 16,
    ...shadow,
  },
  gymImage: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  gymIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: '#E8EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymName: { fontSize: 16, fontWeight: '800', color: colors.text },
  gymCategory: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },

  acessoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadow,
  },
  acessoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  acessoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acessoNome: { fontSize: 15, fontWeight: '800', color: colors.text },
  acessoSubtitulo: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  origemPill: {
    backgroundColor: '#EEF1FC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    maxWidth: 140,
  },
  origemPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.blue,
  },

  acessoInfoRows: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
  },
  acessoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  acessoInfoRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acessoInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acessoInfoLabel: { fontSize: 13, color: colors.text },
  acessoInfoValue: { fontSize: 13.5, fontWeight: '700', color: colors.text },

  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 14,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  footer: { padding: 20, paddingBottom: 30, gap: 10 },
  primaryButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  outlineButton: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: { color: colors.blue, fontWeight: '700', fontSize: 15 },
  secondaryButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
});
