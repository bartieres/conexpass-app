import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../../theme/theme';
import ReportProblemModal from '../ReportProblemModal';
//import CommentsSection from './CommentsSection';

// Ordem de exibição do horário semanal — códigos batem com o cadastro no
// painel web (EstabelecimentoFormPage): 1 = Domingo ... 7 = Sábado.
const DIAS_SEMANA_ORDEM = [
  { value: '1', label: 'Domingo', codigo: 'DOMINGO' },
  { value: '2', label: 'Segunda-feira', codigo: 'SEGUNDA_FEIRA' },
  { value: '3', label: 'Terça-feira', codigo: 'TERCA_FEIRA' },
  { value: '4', label: 'Quarta-feira', codigo: 'QUARTA_FEIRA' },
  { value: '5', label: 'Quinta-feira', codigo: 'QUINTA_FEIRA' },
  { value: '6', label: 'Sexta-feira', codigo: 'SEXTA_FEIRA' },
  { value: '7', label: 'Sábado', codigo: 'SABADO' },
];

// Tipo de plano/oferta -> badge exibido no card (cor e texto). Ajusta os
// códigos conforme o enum real do backend (chutei RECORRENTE/PACOTE/AVULSO).
const TIPO_OFERTA_META = {
  RECORRENTE: { label: 'Recorrente', color: colors.blue, bg: '#DBEAFE' },
  PACOTE: { label: 'Pacote', color: '#7C3AED', bg: '#EDE9FE' },
  AVULSO: { label: 'Avulso', color: colors.success, bg: colors.successLight },
};

function formatarHora(hora) {
  if (!hora) return '';
  return hora.slice(0, 5); // "06:00:00" -> "06:00"
}

function formatarPeriodos(horario) {
  if (!horario) return 'Fechado';
  const periodos = [];
  if (horario.horaAbertura1 && horario.horaFechamento1) {
    periodos.push(
      `${formatarHora(horario.horaAbertura1)} - ${formatarHora(horario.horaFechamento1)}`
    );
  }
  if (horario.horaAbertura2 && horario.horaFechamento2) {
    periodos.push(
      `${formatarHora(horario.horaAbertura2)} - ${formatarHora(horario.horaFechamento2)}`
    );
  }
  return periodos.length > 0 ? periodos.join(' / ') : 'Fechado';
}

function formatarDataExcecao(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarValor(valor) {
  if (valor == null) return '';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/*const handleShare = async (gym) => {
  const link = `conexpass://estabelecimento/${gym.id}`;
  try {
    await Share.share({
      message: `Confira ${gym.name} no ConexPass!\n${link}`,
    });
  } catch (err) {
    console.warn('Erro ao compartilhar:', err);
  }
};*/

const TABS = [
  { key: 'sobre', label: 'Sobre' },
  { key: 'planos', label: 'Planos e ofertas' },
  { key: 'horarios', label: 'Horários' },
];

function TabBar({ activeTab, onChangeTab }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const ativa = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onChangeTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, ativa && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {ativa && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SobreTab({ gym, loadingDetalhes, abrirNoMaps, ehParceiro }) {
  return (
    <>
      {!!gym.about && (
        <>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.aboutText}>{gym.about}</Text>
        </>
      )}

      {!!gym.address && (
        <>
          <Text style={styles.sectionTitle}>Endereço</Text>
          <TouchableOpacity
            style={styles.addressRow}
            onPress={abrirNoMaps}
            activeOpacity={0.7}
          >
            <Text style={styles.addressText}>{gym.address}</Text>
            <Ionicons
              name="navigate-circle-outline"
              size={22}
              color={colors.blue}
            />
          </TouchableOpacity>
        </>
      )}

      {ehParceiro && !loadingDetalhes && !!gym.amenities?.length && (
        <>
          <Text style={styles.sectionTitle}>Comodidades</Text>
          <View style={styles.amenitiesRow}>
            {gym.amenities.map((a) => (
              <View key={a.label} style={styles.amenityItem}>
                <View style={styles.amenityIconWrap}>
                  <Ionicons name={a.icon} size={18} color={colors.blue} />
                </View>
                <Text style={styles.amenityLabel}>{a.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </>
  );
}

function PlanosTab({ planos, loadingPlanos, planosError, onRetryPlanos, onSelecionarOferta }) {
  if (loadingPlanos) {
    return (
      <View style={styles.tabLoadingBox}>
        <ActivityIndicator size="small" color={colors.blue} />
        <Text style={styles.tabLoadingText}>Carregando planos e ofertas...</Text>
      </View>
    );
  }

  if (planosError) {
    return (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
        <Text style={styles.errorText}>{planosError}</Text>
        <TouchableOpacity onPress={onRetryPlanos}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!planos?.length) {
    return (
      <View style={styles.tabEmptyBox}>
        <Ionicons name="pricetags-outline" size={28} color={colors.textLight} />
        <Text style={styles.tabEmptyText}>
          Nenhum plano ou oferta cadastrado por este estabelecimento ainda.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Planos e ofertas</Text>
      <Text style={styles.sectionSubtitle}>
        Escolha a opção ideal para treinar nesta academia.
      </Text>

      {planos.map((oferta) => {
        const meta = TIPO_OFERTA_META[oferta.tipo.codigo] || {
          label: oferta.tipo.codigo,
          color: colors.textMuted,
          bg: colors.chipBg,
        };

        return (
          <TouchableOpacity
            key={oferta.id}
            style={styles.ofertaCard}
            activeOpacity={0.7}
            onPress={() => onSelecionarOferta?.(oferta)}
          >
            <View style={styles.ofertaTopRow}>
              <Text style={styles.ofertaNome} numberOfLines={1}>
                {oferta.nome}
              </Text>
              <View style={[styles.ofertaBadge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.ofertaBadgeText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
            </View>

            {!!oferta.descricao && (
              <Text style={styles.ofertaDescricao} numberOfLines={2}>
                {oferta.descricao}
              </Text>
            )}

            <View style={styles.ofertaBottomRow}>
              <View style={styles.ofertaPrecoRow}>
                <Text style={styles.ofertaPreco}>
                  {formatarValor(oferta.valor)}
                </Text>
                {!!oferta.periodicidade && (
                  <Text style={styles.ofertaPeriodicidade}>
                    /{oferta.periodicidade}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textLight}
              />
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.ofertaInfoBox}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.textMuted}
        />
        <Text style={styles.ofertaInfoText}>
          Os planos e ofertas são disponibilizados diretamente por este
          estabelecimento.
        </Text>
      </View>
    </>
  );
}

function HorariosTab({ gym }) {
  const temHorarios = !!gym.horarios?.length;
  const temExcecoes = !!gym.horariosExcecao?.length;

  if (!temHorarios && !temExcecoes) {
    return (
      <View style={styles.tabEmptyBox}>
        <Ionicons name="time-outline" size={28} color={colors.textLight} />
        <Text style={styles.tabEmptyText}>
          Horários de funcionamento não informados.
        </Text>
      </View>
    );
  }

  return (
    <>
      {temHorarios && (
        <>
          <Text style={styles.sectionTitle}>Horário de atendimento</Text>
          <View style={styles.scheduleCard}>
            {DIAS_SEMANA_ORDEM.map((dia, index) => {
              const horarioDoDia = gym.horarios.find(
                (h) => h.diaSemana.codigo === dia.codigo
              );

              return (
                <View
                  key={dia.value}
                  style={[
                    styles.scheduleRow,
                    index < DIAS_SEMANA_ORDEM.length - 1 &&
                      styles.scheduleRowDivider,
                  ]}
                >
                  <Text style={styles.scheduleDay}>{dia.label}</Text>
                  <Text
                    style={[
                      styles.scheduleHours,
                      !horarioDoDia && styles.scheduleHoursClosed,
                    ]}
                  >
                    {formatarPeriodos(horarioDoDia)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {temExcecoes && (
        <>
          <Text style={styles.sectionTitle}>Horários especiais</Text>
          <View style={styles.scheduleCard}>
            {gym.horariosExcecao.map((excecao, index) => (
              <View
                key={`${excecao.data}-${index}`}
                style={[
                  styles.exceptionRow,
                  index < gym.horariosExcecao.length - 1 &&
                    styles.scheduleRowDivider,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.exceptionDate}>
                    {formatarDataExcecao(excecao.data)}
                  </Text>
                  {!!excecao.descricao && (
                    <Text style={styles.exceptionDescription}>
                      {excecao.descricao}
                    </Text>
                  )}
                </View>
                <Text style={styles.scheduleHours}>
                  {formatarPeriodos(excecao)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </>
  );
}

export default function EstablishmentDetail({
  navigation,
  estabelecimento,
  loadingDetalhes,
  detalhesError,
  onRetryDetalhes,
  onRegistrarInteresse,
  registrandoInteresse,
  onReportarProblema,
  reportandoProblema,
  reportError,
  reportModalVisible,
  onOpenReportModal,
  onCloseReportModal,
  comentarios,
  loadingComentarios,
  comentariosError,
  onRetryComentarios,
  onEnviarComentario,
  enviandoComentario,
  activeTab,
  onChangeTab,
  planos,
  loadingPlanos,
  planosError,
  onRetryPlanos,
  onSelecionarOferta,
}) {
  const gym = estabelecimento;
  //const [favorite, setFavorite] = useState(false);

  const handleCheckin = () => {
    navigation.navigate('ConfirmCheckIn', { estabelecimento: gym });
  };

  //const temAvaliacao = gym.rating != null;
  const ehParceiro = gym.parceiro !== false;

  const abrirLink = (url) => {
    if (!url) return;
    const comProtocolo = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(comProtocolo).catch(() => {});
  };

  const abrirNoMaps = () => {
    // Prioriza coordenadas (mais preciso), cai pro endereço em texto se não tiver.
    // TODO: confirmar se o backend manda latitude/longitude no gym — chutei
    // gym.latitude / gym.longitude, ajusta se o campo real tiver outro nome
    // (ex: gym.endereco?.latitude).
    const temCoordenadas = gym.latitude != null && gym.longitude != null;
    const query = temCoordenadas
      ? `${gym.latitude},${gym.longitude}`
      : encodeURIComponent(`${gym.name} ${gym.address || ''}`.trim());

    const urlNativa = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });

    const urlWeb = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.openURL(urlNativa).catch(() => {
      // App de mapas nativo não abriu (raro, mas pode acontecer) — cai pro
      // navegador, que sempre funciona.
      Linking.openURL(urlWeb).catch(() => {});
    });
  };

  const fechado = gym.horarioFuncionamento?.aberto === false;
  const checkinHojeUtilizado = gym.checkinHojeAutorizado !== true;
  const usuarioDentroLimiteDistancia = gym.usuarioDentroLimiteDistancia;

  const checkinDesabilitado =
    gym.parceiro === false ||
    gym.inclusoPlanoUsuario === false ||
    fechado ||
    checkinHojeUtilizado ||
    usuarioDentroLimiteDistancia === false;

  const textoBotao = gym.parceiro === false
    ? 'Estabelecimento não parceiro'
    : gym.inclusoPlanoUsuario === false
      ? 'Não incluso no seu plano'
      : fechado
        ? 'Fechado no momento'
        : checkinHojeUtilizado
          ? 'Check-in diário utilizado'
          : usuarioDentroLimiteDistancia === false
            ? 'Aproxime-se para fazer check-in'
            : 'Fazer Check-in';

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: gym.image }} style={styles.image} />
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.roundButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            {/*<View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.roundButton} onPress={() => handleShare(gym)}>
                <Ionicons name="share-outline" size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundButton} onPress={() => setFavorite((f) => !f)}>
                <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={favorite ? '#EF4444' : colors.text} />
              </TouchableOpacity>
            </View>*/}
          </View>
          {!!gym.hours && ehParceiro && (
            <View
              style={[
                styles.openBadge,
                !gym.horarioFuncionamento?.aberto && styles.closedBadge,
              ]}
            >
              <Text style={styles.openBadgeText}>{gym.hours}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Destaque: estabelecimento não parceiro */}
          {!ehParceiro && (
            <View style={styles.notPartnerBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
              <Text style={styles.notPartnerText}>
                Estabelecimento não parceiro
              </Text>
            </View>
          )}

          <Text style={styles.name}>{gym.name}</Text>
          {!!gym.category && (
            <Text style={styles.category}>{gym.category}</Text>
          )}

          <View style={styles.ratingRow}>
            {/*{temAvaliacao ? (
              <>
                <Ionicons name="star" size={15} color={colors.star} />
                <Text style={styles.ratingText}>
                  {gym.rating} ({gym.reviews ?? 0} avaliações)
                </Text>
              </>
            ) : loadingDetalhes ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : (
              <Text style={styles.ratingText}>Sem avaliações ainda</Text>
            )}*/}
            {!!gym.distance && (
              <>
                {/*<Text style={styles.dot}>•</Text>*/}
                <Text style={styles.distanceText}>
                  Distância {gym.distance}
                </Text>
              </>
            )}
          </View>

          {/* Destaque: cobertura do plano (só faz sentido pra estabelecimento parceiro) */}
          {ehParceiro && !loadingDetalhes && gym.plano && (
            <View
              style={[
                styles.coverageBanner,
                gym.inclusoPlanoUsuario
                  ? styles.coverageBannerOk
                  : styles.coverageBannerWarning,
              ]}
            >
              <Ionicons
                name={
                  gym.inclusoPlanoUsuario
                    ? 'checkmark-circle'
                    : 'information-circle-outline'
                }
                size={18}
                color={gym.inclusoPlanoUsuario ? colors.success : '#B45309'}
              />
              <Text
                style={[
                  styles.coverageText,
                  {
                    color: gym.inclusoPlanoUsuario ? colors.success : '#92400E',
                  },
                ]}
              >
                {gym.inclusoPlanoUsuario
                  ? 'Incluso no seu plano atual'
                  : gym.plano
                    ? `Disponível no plano ${gym.plano.nome}`
                    : 'Não incluso no seu plano atual'}
              </Text>
            </View>
          )}

          {!!detalhesError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{detalhesError}</Text>
              <TouchableOpacity onPress={onRetryDetalhes}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {loadingDetalhes && !detalhesError && (
            <View style={styles.loadingDetailsBox}>
              <ActivityIndicator size="small" color={colors.blue} />
              <Text style={styles.loadingDetailsText}>
                Carregando mais informações...
              </Text>
            </View>
          )}

          {/* Site e Instagram */}
          {!loadingDetalhes && (!!gym.website || !!gym.instagram) && (
            <View style={styles.linksRow}>
              {!!gym.website && (
                <TouchableOpacity
                  style={styles.linkChip}
                  onPress={() => abrirLink(gym.website)}
                >
                  <Ionicons
                    name="globe-outline"
                    size={15}
                    color={colors.blue}
                  />
                  <Text style={styles.linkChipText} numberOfLines={1}>
                    Site
                  </Text>
                </TouchableOpacity>
              )}
              {!!gym.instagram && (
                <TouchableOpacity
                  style={styles.linkChip}
                  onPress={() =>
                    abrirLink(
                      `https://instagram.com/${gym.instagram.replace('@', '')}`
                    )
                  }
                >
                  <Ionicons
                    name="logo-instagram"
                    size={15}
                    color={colors.blue}
                  />
                  <Text style={styles.linkChipText} numberOfLines={1}>
                    {gym.instagram}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Abas: Sobre / Planos e ofertas / Horários */}
          <TabBar activeTab={activeTab} onChangeTab={onChangeTab} />

          {activeTab === 'sobre' && (
            <SobreTab
              gym={gym}
              loadingDetalhes={loadingDetalhes}
              abrirNoMaps={abrirNoMaps}
              ehParceiro={ehParceiro}
            />
          )}

          {activeTab === 'planos' && (
            <PlanosTab
              planos={planos}
              loadingPlanos={loadingPlanos}
              planosError={planosError}
              onRetryPlanos={onRetryPlanos}
              onSelecionarOferta={onSelecionarOferta}
            />
          )}

          {activeTab === 'horarios' && <HorariosTab gym={gym} />}

          {/* Interesse em treinar ali (só quando não é parceiro) */}
          {!ehParceiro && (
            <>
              {!!gym.totalInteresses && (
                <View style={styles.interestCountRow}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.textMuted}
                  />

                  <Text style={styles.interestCountText}>
                    {gym.totalInteresses === 1
                      ? '1 pessoa tem interesse em treinar aqui'
                      : `${gym.totalInteresses} pessoas têm interesse em treinar aqui`}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.interestButton,
                  gym.usuarioPossuiInteresse && styles.interestButtonDone,
                ]}
                onPress={onRegistrarInteresse}
                disabled={
                  registrandoInteresse ||
                  gym.usuarioPossuiInteresse
                }
              >
                {registrandoInteresse ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.blue}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={
                        gym.usuarioPossuiInteresse
                          ? 'checkmark-circle'
                          : 'heart-circle-outline'
                      }
                      size={18}
                      color={
                        gym.usuarioPossuiInteresse
                          ? colors.success
                          : colors.blue
                      }
                    />

                    <Text
                      style={[
                        styles.interestButtonText,
                        gym.usuarioPossuiInteresse &&
                          styles.interestButtonTextDone,
                      ]}
                    >
                      {gym.usuarioPossuiInteresse
                        ? 'Interesse registrado'
                        : 'Tenho interesse em treinar aqui'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Reportar problema */}
          <TouchableOpacity style={styles.reportRow} onPress={onOpenReportModal}>
            <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
            <Text style={styles.reportText}>Reportar um problema</Text>
          </TouchableOpacity>

          {/* Comentários */}
          {/*<CommentsSection
            comentarios={comentarios}
            loading={loadingComentarios}
            error={comentariosError}
            onRetry={onRetryComentarios}
            onSubmit={onEnviarComentario}
            sending={enviandoComentario}
          />*/}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.checkinButton,
            checkinDesabilitado && styles.checkinButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleCheckin}
          disabled={checkinDesabilitado}
        >
          <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
          <Text style={styles.checkinButtonText}>{textoBotao}</Text>
        </TouchableOpacity>
      </View>

      <ReportProblemModal
        visible={reportModalVisible}
        onClose={onCloseReportModal}
        onSubmit={onReportarProblema}
        sending={reportandoProblema}
        error={reportError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageWrap: { height: 260, position: 'relative' },
  image: { width: '100%', height: '100%' },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBadge: {
    position: 'absolute',
    bottom: 14,
    left: 20,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  closedBadge: {
    backgroundColor: '#DC2626', // ou colors.textLight, se preferir um cinza neutro em vez de vermelho
  },
  openBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 10 },

  notPartnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  notPartnerText: { fontSize: 12.5, fontWeight: '700', color: '#92400E' },

  name: { ...typography.h1, fontSize: 22 },
  category: { ...typography.muted, marginTop: 2 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    minHeight: 20,
  },
  ratingText: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  dot: { color: colors.textLight },
  distanceText: { fontSize: 13, color: colors.textMuted },

  coverageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  coverageBannerOk: { backgroundColor: colors.successLight },
  coverageBannerWarning: { backgroundColor: '#FEF3C7' },
  coverageText: { fontSize: 12.5, fontWeight: '700', flex: 1 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 14,
  },
  errorText: { color: '#DC2626', fontSize: 12, flex: 1 },
  retryText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  loadingDetailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingDetailsText: { fontSize: 12.5, color: colors.textMuted },

  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',           // <- permite quebrar linha
    marginTop: 4,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    // "justifyContent: 'space-between'" saiu daqui — com wrap ele deixa
    // buracos estranhos na última linha quando ela não fecha o total de
    // colunas (ex: 5 itens = última linha só com 1, esticado igual às de 4)
  },
  amenityItem: {
    alignItems: 'center',
    gap: 6,
    width: '25%',                // <- 4 colunas por linha, em vez de flex:1
    marginBottom: 16,            // <- respiro entre as linhas quando quebra
  },
  amenityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },

  linksRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.chipBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  linkChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.blue,
    maxWidth: 140,
  },

  // Abas
  tabBar: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    marginRight: 22,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.blue,
    fontWeight: '700',
  },
  tabIndicator: {
    marginTop: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.blue,
  },
  tabLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  tabLoadingText: { fontSize: 12.5, color: colors.textMuted },
  tabEmptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  tabEmptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  sectionTitle: { ...typography.h3, marginTop: 20, marginBottom: 8 },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -4,
    marginBottom: 14,
  },
  aboutText: { ...typography.body, color: colors.textMuted, lineHeight: 20 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginRight: 10,
    lineHeight: 18,
  },

  // Planos e ofertas
  ofertaCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
  },
  ofertaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ofertaNome: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  ofertaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ofertaBadgeText: { fontSize: 11, fontWeight: '700' },
  ofertaDescricao: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 17,
  },
  ofertaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  ofertaPrecoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  ofertaPreco: { fontSize: 17, fontWeight: '700', color: colors.blue },
  ofertaPeriodicidade: { fontSize: 12.5, color: colors.textMuted },
  ofertaInfoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 4,
  },
  ofertaInfoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },

  scheduleCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  scheduleRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleDay: { fontSize: 13, color: colors.text, fontWeight: '600' },
  scheduleHours: { fontSize: 13, color: colors.textMuted },
  scheduleHoursClosed: { color: colors.textLight },
  exceptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 10,
  },
  exceptionDate: { fontSize: 13, fontWeight: '700', color: colors.text },
  exceptionDescription: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.chipBg,
    height: 50,
    borderRadius: radius.md,
    marginTop: 20,
  },
  interestButtonDone: { backgroundColor: colors.successLight },
  interestButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },
  interestButtonTextDone: { color: colors.success },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  reportText: {
    fontSize: 12.5,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  checkinButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  checkinButtonDisabled: { opacity: 0.5 },
  interestCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },

  interestCountText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
