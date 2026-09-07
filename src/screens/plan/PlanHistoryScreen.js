import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../theme/theme';
import { planoService } from '../../services/planoService';

function formatarMoeda(valor) {
  if (valor == null) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function HistoricoItem({ item, isLast }) {
  return (
    <View style={styles.histItem}>
      <View style={styles.histLine}>
        <View style={styles.histDot} />
        {!isLast && <View style={styles.histConnector} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
        <Text style={styles.histDate}>{formatarData(item.data)}</Text>
        <Text style={styles.histTitle}>{item.descricao}</Text>
        {!!item.valor && <Text style={styles.histValue}>{formatarMoeda(item.valor)}/mês</Text>}
      </View>
    </View>
  );
}

export default function PlanHistoryScreen({ navigation }) {
  const [condicoes, setCondicoes] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: confirmar endpoints/formatos exatos no backend — assumindo
      // dois retornos separados (condições atuais + linha do tempo de alterações).
      const [dadosCondicoes, dadosHistorico] = await Promise.all([
        planoService.getCondicoesAtuais(),
        planoService.getHistorico(),
      ]);
      setCondicoes(dadosCondicoes);
      setHistorico(dadosHistorico);
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar o histórico do seu plano.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico do plano</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.stateButton} onPress={buscarDados}>
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && condicoes && (
          <>
            <Text style={styles.sectionTitle}>Condições atuais</Text>
            <View style={styles.card}>
              <View style={styles.condRow}>
                <Text style={styles.condLabel}>Plano contratado</Text>
                <Text style={styles.condValue}>{condicoes.nome}</Text>
              </View>
              <View style={styles.condDivider} />
              <View style={styles.condRow}>
                <Text style={styles.condLabel}>Valor</Text>
                <Text style={styles.condValue}>{formatarMoeda(condicoes.valor)}/mês</Text>
              </View>
              <View style={styles.condDivider} />
              <View style={styles.condRow}>
                <Text style={styles.condLabel}>Data de contratação</Text>
                <Text style={styles.condValue}>{formatarData(condicoes.dataContratacao)}</Text>
              </View>
              <View style={styles.condDivider} />
              <View style={styles.condRow}>
                <Text style={styles.condLabel}>Limite de check-ins</Text>
                <Text style={styles.condValue}>{condicoes.checkinsPorDia}x por dia</Text>
              </View>

              {!!condicoes.regras?.length && (
                <>
                  <View style={styles.condDivider} />
                  <Text style={[styles.condLabel, { marginBottom: 6 }]}>Condições aplicáveis</Text>
                  {condicoes.regras.map((regra) => (
                    <View key={regra} style={styles.regraRow}>
                      <Ionicons name="ellipse" size={5} color={colors.textMuted} />
                      <Text style={styles.regraText}>{regra}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Histórico</Text>
            <View style={styles.card}>
              {historico.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma alteração registrada ainda.</Text>
              ) : (
                historico.map((item, index) => (
                  <HistoricoItem key={item.id} item={item} isLast={index === historico.length - 1} />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  body: { padding: 20, paddingTop: 4 },

  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, ...shadow },
  condRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  condLabel: { fontSize: 12.5, color: colors.textMuted },
  condValue: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  condDivider: { height: 1, backgroundColor: colors.border },
  regraRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  regraText: { fontSize: 12.5, color: colors.textMuted, flex: 1 },

  histItem: { flexDirection: 'row', gap: 12 },
  histLine: { alignItems: 'center', width: 12 },
  histDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue, marginTop: 3 },
  histConnector: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  histDate: { fontSize: 11.5, color: colors.textMuted, fontWeight: '600' },
  histTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text, marginTop: 2 },
  histValue: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  emptyText: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingVertical: 16 },
});
