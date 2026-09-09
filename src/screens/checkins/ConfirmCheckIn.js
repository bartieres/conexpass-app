import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../../theme/theme';

const TYPE_META = {
  Plano: { color: colors.blue, bg: '#E8EEFC', icon: 'calendar-outline' },
  Avulso: { color: '#B45309', bg: '#FEF3C7', icon: 'cart-outline' },
  Bônus: { color: colors.success, bg: colors.successLight, icon: 'gift-outline' },
};

function DisponibilidadeRow({ label, value, meta, isLast }) {
  return (
    <View style={[styles.dispRow, !isLast && styles.dispRowDivider]}>
      <View style={styles.dispLeft}>
        <View style={[styles.dispIconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={16} color={meta.color} />
        </View>
        <Text style={styles.dispLabel}>{label}</Text>
      </View>
      <Text style={styles.dispValue}>{value}</Text>
    </View>
  );
}

export default function ConfirmCheckIn({
  navigation,
  estabelecimento,
  resumo,
  loadingResumo,
  resumoError,
  onRetryResumo,
  tipoUtilizado,
  loadingLocation,
  permissionDenied,
  onRetryLocation,
  confirming,
  confirmError,
  onConfirmar,
}) {
  const meta = TYPE_META[tipoUtilizado?.nome] || TYPE_META.Plano;
  const semCheckinsDisponiveis = !loadingResumo && !resumoError && !tipoUtilizado;
  const podeConfirmar =
    !!tipoUtilizado && !loadingLocation && !permissionDenied && !confirming && !loadingResumo && !resumoError;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar check-in</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.gymCard}>
          <View style={styles.gymIconWrap}>
            <Ionicons name="barbell-outline" size={26} color={colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gymName}>{estabelecimento?.name}</Text>
            {!!estabelecimento?.address && (
              <View style={styles.gymInfoRow}>
                <Ionicons name="location-outline" size={13} color={colors.textLight} />
                <Text style={styles.gymInfoText} numberOfLines={1}>
                  {estabelecimento.address}
                </Text>
              </View>
            )}
            {!!estabelecimento?.hours && (
              <View style={styles.gymInfoRow}>
                <Ionicons name="time-outline" size={13} color={colors.textLight} />
                <Text style={styles.gymInfoText}>{estabelecimento.hours}</Text>
              </View>
            )}
          </View>
        </View>

        {loadingResumo && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {!loadingResumo && !!resumoError && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
            <Text style={styles.stateText}>{resumoError}</Text>
            <TouchableOpacity style={styles.stateButton} onPress={onRetryResumo}>
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loadingResumo && !resumoError && tipoUtilizado && (
          <View style={styles.usoCard}>
            <Text style={styles.usoTitle}>Será utilizado:</Text>
            <View style={styles.usoRow}>
              <View style={styles.usoLeft}>
                <View style={[styles.usoIconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={17} color={meta.color} />
                </View>
                <Text style={styles.usoLabel}>Check-in do {tipoUtilizado.nome.toLowerCase()}</Text>
              </View>
              <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
                <Text style={[styles.typePillText, { color: meta.color }]}>{tipoUtilizado.nome}</Text>
              </View>
            </View>
          </View>
        )}

        {semCheckinsDisponiveis && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
            <Text style={styles.stateText}>
              Você não tem check-ins disponíveis no momento. Verifique seu plano ou adquira um check-in avulso.
            </Text>
          </View>
        )}

        {!loadingResumo && !resumoError && resumo && (
          <>
            <Text style={styles.disponiveisTitle}>Você tem disponíveis:</Text>
            <View style={styles.dispCard}>
              <DisponibilidadeRow label="Check-ins do plano" value={resumo.plano} meta={TYPE_META.Plano} />
              <DisponibilidadeRow label="Check-ins avulsos" value={resumo.avulso} meta={TYPE_META.Avulso} />
              <DisponibilidadeRow label="Check-ins bônus" value={resumo.bonus} meta={TYPE_META.Bônus} isLast />
            </View>
          </>
        )}

        {permissionDenied && (
          <View style={styles.warningBox}>
            <Ionicons name="location-outline" size={16} color="#B45309" />
            <Text style={styles.warningText}>
              Precisamos da sua localização para confirmar que você está no estabelecimento.
            </Text>
            <TouchableOpacity onPress={onRetryLocation}>
              <Text style={styles.warningLink}>Permitir localização</Text>
            </TouchableOpacity>
          </View>
        )}

        {!permissionDenied && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.blue} />
            <Text style={styles.infoText}>
              O check-in será confirmado com base na sua localização, garantindo que você esteja próximo ao
              estabelecimento.
            </Text>
          </View>
        )}

        {!!confirmError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{confirmError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, !podeConfirmar && styles.confirmButtonDisabled]}
          onPress={onConfirmar}
          disabled={!podeConfirmar}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar check-in</Text>
          )}
        </TouchableOpacity>
      </View>
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
  body: { padding: 20, paddingTop: 4, paddingBottom: 30 },

  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 18,
    ...shadow,
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
  gymInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  gymInfoText: { fontSize: 12.5, color: colors.textMuted, flexShrink: 1 },

  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  stateText: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 2,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },

  usoCard: {
    backgroundColor: '#EEF1FC',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  usoTitle: { fontSize: 14, fontWeight: '800', color: colors.blue, marginBottom: 10 },
  usoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  usoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  usoIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  usoLabel: { fontSize: 13.5, fontWeight: '700', color: colors.text, flexShrink: 1 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  typePillText: { fontSize: 11.5, fontWeight: '700' },

  disponiveisTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 10 },
  dispCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    marginBottom: 18,
    ...shadow,
  },
  dispRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  dispRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dispLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dispIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dispLabel: { fontSize: 13.5, color: colors.text },
  dispValue: { fontSize: 15, fontWeight: '800', color: colors.text },

  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 6,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  warningBox: {
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 6,
  },
  warningText: { fontSize: 12, color: '#92400E', lineHeight: 17 },
  warningLink: { fontSize: 12.5, fontWeight: '700', color: '#B45309', textDecorationLine: 'underline' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 12,
  },
  errorText: { color: '#DC2626', fontSize: 12.5, flex: 1 },

  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  confirmButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
