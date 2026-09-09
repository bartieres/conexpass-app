import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';
import { getStatus, cancelar } from '../../services/checkinService';

const INTERVALO_POLLING_MS = 3000; // pergunta ao backend a cada 3s
const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos esperando sem resposta

/**
 * CheckInPendingScreen
 *
 * Fica aberta enquanto o check-in está com status PENDENTE, fazendo polling
 * no backend até a recepção do estabelecimento aprovar ou recusar. Isso
 * existe porque "salvou no banco" não é o mesmo que "confirmado" — a
 * confirmação de verdade depende de uma ação humana do outro lado (o
 * atendente no painel web).
 *
 * route.params esperado: { checkinId, estabelecimento }
 */
export default function CheckInPendingScreen({ route, navigation }) {
  const { checkinId, estabelecimento } = route?.params ?? {};

  // 'aguardando' | 'confirmado' | 'recusado' | 'expirado' | 'erro'
  const [status, setStatus] = useState('aguardando');
  const [erro, setErro] = useState('');
  const [cancelando, setCancelando] = useState(false);

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

  const handleCancelar = () => {
    Alert.alert('Cancelar check-in', 'Deseja cancelar essa solicitação de check-in?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          pararPolling();
          setCancelando(true);
          try {
            // TODO: confirmar endpoint exato de cancelamento
            await cancelar(checkinId);
          } catch (err) {
            // mesmo se falhar o cancelamento no backend, deixa o usuário sair da tela
          } finally {
            setCancelando(false);
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const rotateInterpolate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {status === 'aguardando' && (
          <>
            <Animated.View style={[styles.iconCircle, { transform: [{ rotate: rotateInterpolate }] }]}>
              <Ionicons name="time-outline" size={40} color="#fff" />
            </Animated.View>
            <Text style={styles.title}>Aguardando confirmação</Text>
            <Text style={styles.subtitle}>
              Enviamos sua solicitação para a recepção{!!estabelecimento?.name && ` de ${estabelecimento.name}`}.
              Assim que for aprovada, você segue automaticamente.
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
              A recepção não confirmou sua solicitação. Verifique com o estabelecimento ou tente novamente.
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
              A recepção ainda não confirmou sua solicitação. Você pode continuar aguardando ou cancelar.
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

      <View style={styles.footer}>
        {status === 'aguardando' && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancelar} disabled={cancelando}>
            <Text style={styles.secondaryButtonText}>{cancelando ? 'Cancelando...' : 'Cancelar solicitação'}</Text>
          </TouchableOpacity>
        )}

        {status === 'expirado' && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinuarAguardando}>
              <Text style={styles.primaryButtonText}>Continuar aguardando</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleCancelar} disabled={cancelando}>
              <Text style={styles.secondaryButtonText}>{cancelando ? 'Cancelando...' : 'Cancelar'}</Text>
            </TouchableOpacity>
          </>
        )}

        {(status === 'recusado' || status === 'erro') && (
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
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
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  footer: { padding: 20, paddingBottom: 30, gap: 10 },
  primaryButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { height: 46, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
});