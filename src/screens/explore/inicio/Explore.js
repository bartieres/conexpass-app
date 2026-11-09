import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../../../theme/theme';
import { CATEGORIES } from '../../../data/mock';
import SuggestEstablishmentModal from '../SuggestEstablishmentModal';

const CATEGORY_COLORS = {
  TODOS: ['#FCEAF5', '#A82779'],
  ACADEMIA: ['#EEE9FF', '#7043C1'],
  PILATES: ['#E5F7ED', '#23794B'],
  CROSSFIT: ['#FFF0E2', '#B65C15'],
  NATACAO: ['#E4F3FF', '#1876AD'],
  LUTA: ['#FFE9EA', '#B83B50'],
};
const categorias = [
  ...CATEGORIES.filter((c) => c.id !== 'TODOS'),
  CATEGORIES.find((c) => c.id === 'TODOS'),
];

function EstabelecimentoCard({ estabelecimento, onPress }) {
  return (
    <TouchableOpacity
      style={styles.gymCard}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${estabelecimento.name}`}
    >
      <Image source={{ uri: estabelecimento.image }} style={styles.gymImage} />
      <View style={styles.gymInfo}>
        <Text style={styles.gymName} numberOfLines={2}>
          {estabelecimento.name}
        </Text>
        <Text style={styles.gymMeta}>{estabelecimento.category}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={14} color={colors.blue} />
          <Text style={styles.distance}>{estabelecimento.distance}</Text>
          {estabelecimento.parceiro === false && (
            <View style={styles.notPartnerPill}>
              <Text style={styles.notPartnerText}>Não parceiro</Text>
            </View>
          )}
        </View>
        {!!estabelecimento.hours && (
          <Text style={styles.hours}>{estabelecimento.hours}</Text>
        )}
        {estabelecimento.checkinHoje && (
          <Text style={styles.checkinText}>✓ Check-in realizado hoje</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );
}

export default function Explore({
  navigation,
  nomeUsuario,
  exibirBannerPlanos = false,
  search,
  onChangeSearch,
  onSubmitSearch,
  categoriasSelecionadas,
  onSelectCategory,
  raioKm,
  filtrosExtras = {},
  onOpenFilters,
  permissionDenied,
  isLoadingAnything,
  refreshing,
  onRefresh,
  onRetryLocation,
  onRetryEstabelecimentos,
  estabelecimentos,
  estabelecimentosError,
  loadingMore,
  onLoadMore,
  suggestModalVisible,
  onOpenSuggestModal,
  onCloseSuggestModal,
  onSubmitSuggestEstablishment,
  sendingSuggestion,
  suggestionError,
  suggestionSuccess,
}) {
  const nome = nomeUsuario?.trim() || '';
  const primeiroNome = nome.split(/\s+/)[0];
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
  const podeExibirLista =
    !permissionDenied && !isLoadingAnything && !estabelecimentosError;
  const filtrosAtivos =
    categoriasSelecionadas.filter((id) => id !== 'TODOS').length +
    (raioKm !== 10 ? 1 : 0) +
    Object.values(filtrosExtras).filter(Boolean).length;

  const header = (
    <View>
      <View style={styles.brandRow}>
        <Image
          source={require('../../../assets/logo-conexpass.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="ConexPass"
        />
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Perfil')}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
        >
          <Ionicons name="person-outline" size={21} color={colors.blueDark} />
        </TouchableOpacity>
      </View>
      <View style={styles.greetingRow}>
        <View style={styles.avatar}>
          {iniciais ? (
            <Text style={styles.initials}>{iniciais}</Text>
          ) : (
            <Ionicons name="person-outline" size={25} color={colors.blue} />
          )}
        </View>
        <View style={styles.greetingCopy}>
          <Text style={styles.greeting}>
            {primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!'}
          </Text>
          <Text style={styles.subtitle}>O que vamos explorar hoje?</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.locationRow}
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel="Alterar distância nos filtros"
      >
        <Ionicons name="location" size={18} color={colors.blue} />
        <Text style={styles.locationText}>
          Explorando até {raioKm} km de você
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.blue} />
      </TouchableOpacity>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estabelecimentos"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={onChangeSearch}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            accessibilityLabel="Buscar estabelecimentos por nome"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel={`Abrir filtros${filtrosAtivos ? `, ${filtrosAtivos} ativos` : ''}`}
        >
          <Ionicons name="options-outline" size={24} color={colors.white} />
          {filtrosAtivos > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filtrosAtivos}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={categorias}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => {
          const active =
            item.id === 'TODOS'
              ? categoriasSelecionadas.length === 0
              : categoriasSelecionadas.includes(item.id);
          const [backgroundColor, color] = CATEGORY_COLORS[item.id] || [
            colors.chipBg,
            colors.blue,
          ];
          return (
            <TouchableOpacity
              style={[
                styles.category,
                {
                  backgroundColor,
                  borderColor: active ? color : 'transparent',
                },
              ]}
              onPress={() => onSelectCategory(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              <Ionicons name={item.icon} size={27} color={color} />
              <Text style={[styles.categoryText, { color }]}>{item.label}</Text>
              {active && (
                <View
                  style={[styles.categoryDot, { backgroundColor: color }]}
                />
              )}
            </TouchableOpacity>
          );
        }}
      />
      {exibirBannerPlanos && (
        <LinearGradient
          colors={['#E8F1FF', '#DCE8FC', '#ECF8F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroDecoration}>
            <Ionicons name="barbell-outline" size={100} color="#C1D6F5" />
          </View>
          <Text style={styles.eyebrow}>
            MAIS MOVIMENTO, MAIS POSSIBILIDADES
          </Text>
          <Text style={styles.heroTitle}>Encontre seu{'\n'}próximo treino</Text>
          <Text style={styles.heroSubtitle}>
            Academias, estúdios e novas experiências na sua região.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate('Plano')}
            accessibilityRole="button"
          >
            <Text style={styles.heroButtonText}>Conhecer planos</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        </LinearGradient>
      )}
      <Text style={styles.sectionTitle}>Próximos de você</Text>
    </View>
  );

  const estado = permissionDenied
    ? {
        icon: 'location-outline',
        text: 'Permita o acesso à localização para ver estabelecimentos perto de você.',
        action: 'Permitir localização',
        onPress: onRetryLocation,
      }
    : estabelecimentosError
      ? {
          icon: 'alert-circle-outline',
          text: estabelecimentosError,
          action: 'Tentar novamente',
          onPress: onRetryEstabelecimentos,
        }
      : {
          icon: 'search-outline',
          text: 'Nenhum estabelecimento encontrado com esses filtros. Que tal ampliar a distância?',
          action: 'Ajustar filtros',
          onPress: onOpenFilters,
        };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={podeExibirLista ? estabelecimentos : []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.blue]}
            tintColor={colors.blue}
          />
        }
        renderItem={({ item }) => (
          <EstabelecimentoCard
            estabelecimento={item}
            onPress={() =>
              navigation.navigate('EstablishmentDetail', { gym: item })
            }
          />
        )}
        onEndReached={() => {
          if (podeExibirLista && estabelecimentos.length > 0) onLoadMore();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.stateBox}>
            {!permissionDenied && isLoadingAnything ? (
              <>
                <ActivityIndicator color={colors.blue} />
                <Text style={styles.stateText}>
                  Buscando estabelecimentos próximos de você...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name={estado.icon} size={30} color={colors.blue} />
                <Text style={styles.stateText}>{estado.text}</Text>
                <TouchableOpacity
                  style={styles.stateButton}
                  onPress={estado.onPress}
                  accessibilityRole="button"
                >
                  <Text style={styles.heroButtonText}>{estado.action}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          <>
            {loadingMore && (
              <ActivityIndicator
                style={styles.loadingMore}
                color={colors.blue}
              />
            )}
            <TouchableOpacity
              style={styles.suggestBanner}
              onPress={onOpenSuggestModal}
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              <View style={styles.suggestIcon}>
                <Ionicons
                  name="add-circle-outline"
                  size={25}
                  color={colors.blue}
                />
              </View>
              <View style={styles.gymInfo}>
                <Text style={styles.suggestTitle}>
                  Sentiu falta de um lugar?
                </Text>
                <Text style={styles.suggestSubtitle}>
                  Indique e ajude a ampliar nossa rede.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.blue} />
            </TouchableOpacity>
          </>
        }
      />
      <SuggestEstablishmentModal
        visible={suggestModalVisible}
        onClose={onCloseSuggestModal}
        onSubmit={onSubmitSuggestEstablishment}
        sending={sendingSuggestion}
        error={suggestionError}
        success={suggestionSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, paddingBottom: 28, gap: 12 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logo: { width: 182, height: 39 },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E8EFFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.blueDark, fontWeight: '800', fontSize: 21 },
  greetingCopy: { flex: 1 },
  greeting: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 18,
  },
  locationText: {
    color: colors.blue,
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    minHeight: 52,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 14,
  },
  filterButton: {
    width: 52,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -4,
    backgroundColor: colors.blueDark,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  categories: { gap: 10, paddingVertical: 18 },
  category: {
    width: 86,
    minHeight: 94,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 12,
  },
  categoryText: { fontSize: 12, fontWeight: '700' },
  categoryDot: {
    position: 'absolute',
    top: 7,
    right: 9,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  hero: {
    borderRadius: radius.xl,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 26,
  },
  heroDecoration: {
    position: 'absolute',
    right: -18,
    bottom: 10,
    transform: [{ rotate: '-30deg' }],
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.blueDark,
    letterSpacing: 1,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#52617A',
    marginTop: 10,
    maxWidth: '85%',
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 18,
  },
  heroButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 4,
  },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  gymImage: { width: 72, height: 82, borderRadius: 15 },
  gymInfo: { flex: 1, gap: 4 },
  gymName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  gymMeta: { color: colors.textMuted, fontSize: 13 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  distance: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  hours: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  checkinText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  notPartnerPill: {
    backgroundColor: '#FFF1CE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  notPartnerText: { color: '#92400E', fontSize: 10, fontWeight: '700' },
  suggestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EAF0FD',
    borderRadius: 22,
    padding: 16,
    marginTop: 8,
  },
  suggestIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  suggestTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  suggestSubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  stateBox: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 22,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loadingMore: { marginVertical: 18 },
});
