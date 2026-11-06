import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../../theme/theme';
import { dateToDateMasked, dateTimeToDateMasked } from '../../utils/date';

// Visual por origem do acesso — usado na pill do card de ativo, do
// pendente e na linha do histórico.
const ORIGEM_META = {
  PLANO_ESTABELECIMENTO: {
    label: 'Plano do estabelecimento',
    color: colors.blue,
    bg: '#EEF1FC',
    icon: 'barbell-outline',
  },
  PLANO_COMPARTILHADO: {
    label: 'Plano compartilhado',
    color: colors.success,
    bg: colors.successLight,
    icon: 'infinite-outline',
  },
  AVULSO: {
    label: 'Avulso',
    color: '#B45309',
    bg: '#FEF3C7',
    icon: 'cart-outline',
  },
  BONUS: {
    label: 'Bônus',
    color: colors.success,
    bg: colors.successLight,
    icon: 'gift-outline',
  },
};

const SITUACAO_META = {
  CONFIRMADO: {
    label: 'Utilizado',
    color: colors.success,
    bg: colors.successLight,
    icon: 'checkmark-circle',
    descricao: 'Check-in confirmado',
  },
  RECUSADO: {
    label: 'Recusado',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: 'close-circle',
    descricao: 'Check-in recusado',
  },
  EXPIRADO: {
    label: 'Expirado',
    color: colors.textMuted,
    bg: colors.chipBg,
    icon: 'time-outline',
    descricao: 'Check-in expirado',
  },
};

function formatarRelativo(dataISO) {
  if (!dataISO) return '';
  const data = new Date(dataISO);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const mesmoDia = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const hora = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (mesmoDia(data, hoje)) return `Hoje, ${hora}`;
  if (mesmoDia(data, ontem)) return `Ontem, ${hora}`;

  return `${data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })}, ${hora}`;
}

// --------------------------------------------------------------------
// Segmented control: Ativos / Pendentes / Histórico
// --------------------------------------------------------------------
function TabBar({ activeTab, onChangeTab }) {
  const TABS = [
    { key: 'ativos', label: 'Ativos' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'historico', label: 'Histórico' },
  ];

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const ativa = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, ativa && styles.tabItemActive]}
            onPress={() => onChangeTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, ativa && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --------------------------------------------------------------------
// Dropdown genérico de filtro (período / origem)
// --------------------------------------------------------------------
function FiltroDropdown({ icon, opcoes, valorId, onSelect }) {
  const [visible, setVisible] = useState(false);
  const atual = opcoes.find((o) => o.id === valorId) ?? opcoes[0];

  return (
    <>
      <TouchableOpacity
        style={styles.filtroButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name={icon} size={13} color={colors.blue} />
        <Text style={styles.filtroButtonText} numberOfLines={1}>
          {atual.label}
        </Text>
        <Ionicons name="chevron-down" size={13} color={colors.blue} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            {opcoes.map((opcao) => {
              const active = opcao.id === valorId;
              return (
                <TouchableOpacity
                  key={opcao.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(opcao.id);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      active && styles.dropdownItemTextActive,
                    ]}
                  >
                    {opcao.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={16} color={colors.blue} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// --------------------------------------------------------------------
// Aba Ativos
// --------------------------------------------------------------------
function AtivoCard({ item, onPress }) {
  const meta = ORIGEM_META[item.origem?.codigo] || ORIGEM_META.PLANO_ESTABELECIMENTO;

  const usados =
    item.total != null && item.disponiveis != null
      ? item.total - item.disponiveis
      : null;
  const percentualUtilizado =
    usados != null && item.total > 0
      ? Math.round((usados / item.total) * 100)
      : null;

  // O backend nem sempre manda os dois campos juntos: um acesso pode ser
  // "não ilimitado" (ilimitado: false) e ainda assim só vir com
  // `validoAte` preenchido e `proximaRenovacao` nulo (ex: pacote fechado,
  // sem ciclo de renovação). Por isso o fallback é por qual data existe,
  // não só pela flag `ilimitado`.
  const dataExibida = item.proximaRenovacao ?? item.validoAte;
  const rotuloData = item.proximaRenovacao ? 'Renovação em' : 'Válido até';

  return (
    <TouchableOpacity
      style={styles.ativoCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.ativoTopRow}>
        {item.estabelecimento?.image ? (
          <Image
            source={{ uri: item.estabelecimento.image }}
            style={styles.ativoImage}
          />
        ) : (
          <View style={styles.ativoImagePlaceholder}>
            <Ionicons name="barbell-outline" size={22} color={colors.blue} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.ativoEstabelecimento} numberOfLines={1}>
            {item.estabelecimento?.name}
          </Text>
          <Text style={styles.ativoNome} numberOfLines={1}>
            {item.nome}
          </Text>
          <View style={[styles.origemPill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.origemPillText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </View>

      <View style={styles.ativoInfoRow}>
        <View style={styles.ativoInfoItem}>
          <View style={[styles.ativoInfoIconWrap, { backgroundColor: meta.bg }]}>
            <Ionicons
              name={item.ilimitado ? 'infinite-outline' : 'barbell-outline'}
              size={16}
              color={meta.color}
            />
          </View>
          {item.ilimitado ? (
            <View>
              <Text style={styles.ativoInfoValue}>Acesso ilimitado</Text>
              <Text style={styles.ativoInfoLabel}>Durante a vigência</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.ativoInfoValue}>{item.disponiveis}</Text>
              <Text style={styles.ativoInfoLabel}>acessos disponíveis</Text>
            </View>
          )}
        </View>

        {!!dataExibida && (
          <View style={styles.ativoInfoItem}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <View>
              <Text style={styles.ativoInfoLabel}>{rotuloData}</Text>
              <Text style={styles.ativoInfoValue}>
                {dateToDateMasked(dataExibida)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {!item.ilimitado && percentualUtilizado != null && (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, percentualUtilizado)}%` },
              ]}
            />
          </View>
          <View style={styles.progressLegendRow}>
            <Text style={styles.progressLegendText}>
              {percentualUtilizado}% utilizado
            </Text>
            <Text style={styles.progressLegendText}>
              {item.disponiveis} de {item.total} acessos
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

function AtivosTab({
  ativos,
  loadingAtivos,
  ativosError,
  onRetryAtivos,
  refreshingAtivos,
  onRefreshAtivos,
  onAbrirAtivo,
}) {
  if (loadingAtivos) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" color={colors.blue} />
      </View>
    );
  }

  if (ativosError) {
    return (
      <View style={styles.stateBox}>
        <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
        <Text style={styles.stateText}>{ativosError}</Text>
        <TouchableOpacity style={styles.stateButton} onPress={onRetryAtivos}>
          <Text style={styles.stateButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={!!refreshingAtivos}
          onRefresh={onRefreshAtivos}
          colors={[colors.blue]}
          tintColor={colors.blue}
        />
      }
    >
      {!ativos?.length ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="pricetags-outline" size={32} color={colors.textLight} />
          <Text style={styles.emptyText}>
            Você ainda não tem nenhum acesso ativo.
          </Text>
        </View>
      ) : (
        ativos.map((item) => (
          <AtivoCard
            key={item.id}
            item={item}
            onPress={() => onAbrirAtivo?.(item)}
          />
        ))
      )}
    </ScrollView>
  );
}

// --------------------------------------------------------------------
// Aba Pendentes
// --------------------------------------------------------------------
function situacaoPendente(item) {
  const codigo =
    typeof item.situacao === 'string' ? item.situacao : item.situacao?.codigo;

  const descricoes = {
    AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
    PAGAMENTO_PENDENTE: 'Aguardando pagamento',
    PENDENTE: 'Aguardando pagamento',
    EM_PROCESSAMENTO: 'Pagamento em processamento',
    PROCESSANDO: 'Pagamento em processamento',
    AGUARDANDO_ATIVACAO: 'Aguardando ativação',
  };

  return item.situacao?.descricao ?? descricoes[codigo] ?? 'Contratação em andamento';
}

function PendenteCard({ item }) {
  const meta = ORIGEM_META[item.origem?.codigo] || ORIGEM_META.PLANO_ESTABELECIMENTO;
  const situacao = situacaoPendente(item);

  return (
    <View style={styles.pendenteCard}>
      <View style={styles.pendenteTopRow}>
        <View style={styles.ativoImagePlaceholder}>
          <Ionicons name="receipt-outline" size={22} color={colors.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ativoEstabelecimento} numberOfLines={1}>
            {item.estabelecimento?.name || 'ConexPass'}
          </Text>
          <Text style={styles.pendenteSubtitulo} numberOfLines={2}>
            {item.nome}
          </Text>
        </View>
      </View>

      <View style={styles.aguardandoBadge}>
        <Ionicons name="time-outline" size={14} color="#B45309" />
        <Text style={styles.aguardandoBadgeText}>{situacao}</Text>
      </View>

      <View style={[styles.origemPill, { backgroundColor: meta.bg }]}>
        <Text style={[styles.origemPillText, { color: meta.color }]}>
          {item.origem?.descricao || meta.label}
        </Text>
      </View>

      {!!item.contratadoEm && (
        <View style={styles.contratadoRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.contratadoLabel}>Contratado em:</Text>
          <Text style={styles.contratadoValue}>
            {formatarRelativo(item.contratadoEm)}
          </Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={colors.blue} />
        <Text style={styles.infoText}>
          Esta contratação ainda não está liberada para utilização. A
          disponibilidade será atualizada após a confirmação do pagamento e
          ativação.
        </Text>
      </View>
    </View>
  );
}

function PendentesTab({
  pendentes,
  loadingPendentes,
  pendentesError,
  onRetryPendentes,
  refreshingPendentes,
  onRefreshPendentes,
}) {
  if (loadingPendentes) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" color={colors.blue} />
      </View>
    );
  }

  if (pendentesError) {
    return (
      <View style={styles.stateBox}>
        <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
        <Text style={styles.stateText}>{pendentesError}</Text>
        <TouchableOpacity style={styles.stateButton} onPress={onRetryPendentes}>
          <Text style={styles.stateButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={!!refreshingPendentes}
          onRefresh={onRefreshPendentes}
          colors={[colors.blue]}
          tintColor={colors.blue}
        />
      }
    >
      {!pendentes?.length ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="time-outline" size={32} color={colors.textLight} />
          <Text style={styles.emptyText}>
            Nenhuma contratação pendente no momento.
          </Text>
        </View>
      ) : (
        pendentes.map((item) => <PendenteCard key={item.id} item={item} />)
      )}
    </ScrollView>
  );
}

// --------------------------------------------------------------------
// Aba Histórico
// --------------------------------------------------------------------
// MVP: lista só informativa, sem navegação e sem o consumo de acesso por
// linha (esse dado ainda não está confiável vindo do backend).
function HistoricoRow({ item }) {
  const meta = SITUACAO_META[item.situacao?.codigo] || SITUACAO_META.EXPIRADO;
  return (
    <View style={styles.historicoRow}>
      {item.estabelecimento?.image ? (
        <Image
          source={{ uri: item.estabelecimento.image }}
          style={styles.historicoImage}
        />
      ) : (
        <View style={styles.ativoImagePlaceholder}>
          <Ionicons name="barbell-outline" size={20} color={colors.blue} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.historicoNome} numberOfLines={1}>
          {item.estabelecimento?.name}
        </Text>
        <Text style={styles.historicoSubtitulo}>{meta.descricao}</Text>
        <View style={styles.historicoDataRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textLight} />
          <Text style={styles.historicoData}>
            {dateTimeToDateMasked(item.dataSolicitacao)}
          </Text>
        </View>
      </View>

      <View style={[styles.situacaoPill, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={13} color={meta.color} />
        <Text style={[styles.situacaoPillText, { color: meta.color }]}>
          {meta.label}
        </Text>
      </View>
    </View>
  );
}

function HistoricoTab({
  historico,
  loadingHistorico,
  loadingMoreHistorico,
  refreshingHistorico,
  historicoError,
  onRefreshHistorico,
  onLoadMoreHistorico,
  onRetryHistorico,
  periodos,
  periodoId,
  onSelectPeriodo,
}) {
  const sections = [];
  const grupos = new Map();
  historico.forEach((item) => {
    const chave = item.mesLabel;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(item);
  });
  grupos.forEach((data, title) => sections.push({ title, data }));

  const carregado = !loadingHistorico && !historicoError;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <>
          <View style={styles.filtrosRow}>
            <FiltroDropdown
              icon="calendar-outline"
              opcoes={periodos}
              valorId={periodoId}
              onSelect={onSelectPeriodo}
            />
          </View>

          {loadingHistorico && (
            <View style={styles.stateBox}>
              <ActivityIndicator size="small" color={colors.blue} />
              <Text style={styles.stateText}>Carregando seu histórico...</Text>
            </View>
          )}

          {!loadingHistorico && !!historicoError && (
            <View style={styles.stateBox}>
              <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
              <Text style={styles.stateText}>{historicoError}</Text>
              <TouchableOpacity style={styles.stateButton} onPress={onRetryHistorico}>
                <Text style={styles.stateButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      }
      renderSectionHeader={({ section }) =>
        carregado ? (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        ) : null
      }
      renderItem={({ item }) => (carregado ? <HistoricoRow item={item} /> : null)}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        carregado ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={32} color={colors.textLight} />
            <Text style={styles.emptyText}>
              Nenhum check-in registrado nesse período.
            </Text>
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={!!refreshingHistorico}
          onRefresh={onRefreshHistorico}
          colors={[colors.blue]}
          tintColor={colors.blue}
        />
      }
      onEndReached={onLoadMoreHistorico}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMoreHistorico ? (
          <View style={styles.loadingMoreBox}>
            <ActivityIndicator size="small" color={colors.blue} />
            <Text style={styles.loadingMoreText}>Carregando mais...</Text>
          </View>
        ) : null
      }
    />
  );
}

// --------------------------------------------------------------------
// Tela
// --------------------------------------------------------------------
export default function MeusAcessos(props) {
  const { activeTab, onChangeTab } = props;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus acessos</Text>
        <Text style={styles.headerSubtitle}>
          Acompanhe seus planos, saldos e utilizações.
        </Text>
      </View>

      <TabBar activeTab={activeTab} onChangeTab={onChangeTab} />

      {activeTab === 'ativos' && <AtivosTab {...props} />}
      {activeTab === 'pendentes' && <PendentesTab {...props} />}
      {activeTab === 'historico' && <HistoricoTab {...props} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { ...typography.h1 },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
    ...shadow,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  tabItemActive: {
    backgroundColor: '#EEF1FC',
  },
  tabLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  tabLabelActive: { color: colors.blue, fontWeight: '800' },

  tabContent: { paddingHorizontal: 20, paddingBottom: 30, flexGrow: 1 },

  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText: {
    color: colors.textLight,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Card de origem (pill reaproveitada em ativo/pendente)
  origemPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  origemPillText: { fontSize: 11, fontWeight: '700' },

  // Ativos
  ativoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    ...shadow,
  },
  ativoTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  ativoImage: { width: 52, height: 52, borderRadius: radius.md },
  ativoImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: '#E8EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ativoEstabelecimento: { fontSize: 15, fontWeight: '800', color: colors.text },
  ativoNome: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  ativoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ativoInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ativoInfoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ativoInfoValue: { fontSize: 14, fontWeight: '800', color: colors.text },
  ativoInfoLabel: { fontSize: 11.5, color: colors.textMuted },

  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.blue },
  progressLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLegendText: { fontSize: 11.5, color: colors.textMuted },

  // Pendentes
  pendenteCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    ...shadow,
  },
  pendenteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pendenteSubtitulo: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  aguardandoBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  aguardandoBadgeText: { fontSize: 12, fontWeight: '700', color: '#B45309' },

  contratadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  contratadoLabel: { fontSize: 12.5, color: colors.textMuted },
  contratadoValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },

  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 12,
  },
  infoText: { flex: 1, fontSize: 11.5, color: colors.textMuted, lineHeight: 16 },

  // Histórico
  filtrosRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  filtroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filtroButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.blue,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  dropdownMenu: {
    position: 'absolute',
    top: 190,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingVertical: 6,
    minWidth: 180,
    ...shadow,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemText: { fontSize: 13.5, color: colors.text },
  dropdownItemTextActive: { color: colors.blue, fontWeight: '700' },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 8,
  },
  historicoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    ...shadow,
  },
  historicoImage: { width: 44, height: 44, borderRadius: radius.md },
  historicoNome: { fontSize: 14, fontWeight: '700', color: colors.text },
  historicoSubtitulo: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  historicoDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  historicoData: { fontSize: 11.5, color: colors.textLight },
  situacaoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  situacaoPillText: { fontSize: 11, fontWeight: '700' },
  separator: { height: 10 },

  loadingMoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: { fontSize: 12.5, color: colors.textMuted },
});
