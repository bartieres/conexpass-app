import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../../theme/theme';

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function ConfirmCheckIn({
  navigation,
  estabelecimento,
  acesso,
  loadingAcesso,
  acessoError,
  onRetryAcesso,
  loadingLocation,
  permissionDenied,
  onRetryLocation,
  confirming,
  confirmError,
  onSolicitar,
}) {
  const semAcessoDisponivel =
    !loadingAcesso && !acessoError && !acesso;

  const podeConfirmar =
    !!acesso &&
    !loadingLocation &&
    !permissionDenied &&
    !confirming &&
    !loadingAcesso &&
    !acessoError;

  const progresso =
    acesso?.total > 0
      ? Math.max(0, Math.min(1, (acesso.disponiveis ?? 0) / acesso.total))
      : 0;

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar check-in</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.gymCard}>
          {estabelecimento?.image ? (
            <Image
              source={{ uri: estabelecimento.image }}
              style={styles.gymImage}
            />
          ) : (
            <View style={styles.gymIconWrap}>
              <Ionicons name="barbell-outline" size={26} color={colors.blue} />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.gymName}>{estabelecimento?.name}</Text>
            {!!estabelecimento?.category && (
              <Text style={styles.gymCategory} numberOfLines={1}>
                {estabelecimento.category}
              </Text>
            )}

            {!loadingAcesso && !acessoError && !!acesso && (
              <View style={styles.availableBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.success}
                />
                <Text style={styles.availableBadgeText}>
                  Disponível para check-in
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acesso que será utilizado</Text>

        {loadingAcesso && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={colors.blue} />
          </View>
        )}

        {!loadingAcesso && !!acessoError && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
            <Text style={styles.stateText}>{acessoError}</Text>
            <TouchableOpacity
              style={styles.stateButton}
              onPress={onRetryAcesso}
            >
              <Text style={styles.stateButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {semAcessoDisponivel && (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
            <Text style={styles.stateText}>
              Você não tem check-ins disponíveis no momento. Verifique seu
              plano ou adquira uma oferta deste estabelecimento.
            </Text>
          </View>
        )}

        {!loadingAcesso && !acessoError && !!acesso && (
          <View style={styles.acessoCard}>
            <View style={styles.acessoTopRow}>
              <View style={styles.acessoIconWrap}>
                <Ionicons name="barbell-outline" size={22} color={colors.blue} />
              </View>
              <Text style={styles.acessoNome} numberOfLines={1}>
                {acesso.nome}
              </Text>
              {!!acesso.origem?.descricao && (
                <View style={styles.origemPill}>
                  <Text style={styles.origemPillText} numberOfLines={1}>
                    {acesso.origem.descricao}
                  </Text>
                </View>
              )}
            </View>

            {acesso.total != null && (
              <>
                <View style={styles.contadorRow}>
                  <Text style={styles.contadorNumero}>
                    {acesso.disponiveis}
                  </Text>
                  <Text style={styles.contadorLabel}>
                    de {acesso.total} acessos disponíveis{'\n'}no ciclo
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progresso * 100}%` },
                    ]}
                  />
                </View>
              </>
            )}

            <View style={styles.acessoInfoRows}>
              <View style={styles.acessoInfoRow}>
                <View style={styles.acessoInfoLeft}>
                  <Ionicons
                    name="layers-outline"
                    size={16}
                    color={colors.textMuted}
                  />
                  <Text style={styles.acessoInfoLabel}>
                    Este check-in consumirá
                  </Text>
                </View>
                <Text style={styles.acessoInfoValue}>
                  {acesso.consumira ?? 1} acesso
                  {(acesso.consumira ?? 1) > 1 ? 's' : ''}
                </Text>
              </View>

              {acesso.saldoApos != null && (
                <View style={[styles.acessoInfoRow, styles.acessoInfoRowDivider]}>
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
                <View style={[styles.acessoInfoRow, styles.acessoInfoRowDivider]}>
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

        {permissionDenied && (
          <View style={styles.warningBox}>
            <Ionicons name="location-outline" size={16} color="#B45309" />
            <Text style={styles.warningText}>
              Precisamos da sua localização para confirmar que você está no
              estabelecimento.
            </Text>
            <TouchableOpacity onPress={onRetryLocation}>
              <Text style={styles.warningLink}>Permitir localização</Text>
            </TouchableOpacity>
          </View>
        )}

        {!permissionDenied && !!acesso && (
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.blue}
            />
            <Text style={styles.infoText}>
              O acesso será descontado somente após a confirmação do check-in
              pelo estabelecimento.
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
          style={[
            styles.confirmButton,
            !podeConfirmar && styles.confirmButtonDisabled,
          ]}
          onPress={onSolicitar}
          disabled={!podeConfirmar}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirmar check-in</Text>
            </>
          )}
        </TouchableOpacity>
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
  body: { padding: 20, paddingTop: 4, paddingBottom: 30 },

  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 22,
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
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  availableBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },

  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  stateText: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 2,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },

  acessoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 18,
    ...shadow,
  },
  acessoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  acessoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acessoNome: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  origemPill: {
    backgroundColor: '#EEF1FC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    maxWidth: 150,
  },
  origemPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.blue,
  },

  contadorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  contadorNumero: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.blue,
    lineHeight: 36,
  },
  contadorLabel: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 4,
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.blue,
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
  warningLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
    textDecorationLine: 'underline',
  },

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

  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  confirmButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
