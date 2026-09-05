import React from 'react';
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
import { colors, radius, shadow, typography } from '../../theme/theme';
import { CATEGORIES } from '../../data/mock';

function EstabelecimentoCard({ estabelecimento, onPress }) {
  return (
    <TouchableOpacity style={styles.gymCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: estabelecimento.image }} style={styles.gymImage} />
      <View style={styles.gymInfo}>
        <Text style={styles.gymName}>{estabelecimento.name}</Text>
        <Text style={styles.gymMeta}>
          {estabelecimento.distance} • {estabelecimento.hours}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={styles.ratingText}>
            {estabelecimento.rating} ({estabelecimento.reviews})
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

export default function Explore({
  navigation,
  search,
  onChangeSearch,
  onSubmitSearch,
  activeCategory,
  onSelectCategory,
  raioKm,
  onOpenFilters,
  permissionDenied,
  isLoadingAnything,
  refreshing,
  onRefresh,
  onRetryLocation,
  onRetryEstabelecimentos,
  estabelecimentos,
  estabelecimentosError,
  selectedEstabelecimento,
  onSelectEstabelecimento,
  hasMore,
  loadingMore,
  onLoadMore,
}) {
  // view de mapa desativada por enquanto (ver bloco comentado no fim do arquivo)
  // const [view, setView] = React.useState('lista');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explorar</Text>
          {/*
            Antes tínhamos um seletor de cidade aqui. Como o único filtro de
            localização que temos hoje é a distância a partir da posição do
            usuário, deixamos só o texto informativo abaixo (sem dropdown).
          */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.blue} />
            <Text style={styles.locationText}>Até {raioKm} km de você</Text>
          </View>
        </View>

        {/* Sino de notificações - será implementado depois */}
        {/* <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
        </TouchableOpacity> */}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por razão social..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={onChangeSearch}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
          />
        </View>
        {/*
          O ícone de filtro abre a FiltersScreen (categorias, distância,
          estrelas e ordenação). A tela devolve os filtros escolhidos via
          callback (onApply), e é o ExploreScreen quem chama o backend.
        */}
        <TouchableOpacity style={styles.filterButton} onPress={onOpenFilters}>
          <Ionicons name="options-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filtro por estrelas e ordenação agora vivem na FiltersScreen (veja onOpenFilters) */}

      {/* Toggle lista/mapa - mapa desativado por enquanto */}
      {/*
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'lista' && styles.toggleBtnActive]}
          onPress={() => setView('lista')}
        >
          <Text style={[styles.toggleText, view === 'lista' && styles.toggleTextActive]}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'mapa' && styles.toggleBtnActive]}
          onPress={() => setView('mapa')}
        >
          <Text style={[styles.toggleText, view === 'mapa' && styles.toggleTextActive]}>Mapa</Text>
        </TouchableOpacity>
      </View>
      */}

      {permissionDenied && (
        <View style={styles.stateBox}>
          <Ionicons name="location-outline" size={28} color={colors.textLight} />
          <Text style={styles.stateText}>
            Permita o acesso à localização para ver estabelecimentos perto de você.
          </Text>
          <TouchableOpacity style={styles.stateButton} onPress={onRetryLocation}>
            <Text style={styles.stateButtonText}>Permitir localização</Text>
          </TouchableOpacity>
        </View>
      )}

      {!permissionDenied && isLoadingAnything && (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color={colors.blue} />
          <Text style={styles.stateText}>Buscando estabelecimentos próximos de você...</Text>
        </View>
      )}

      {!permissionDenied && !isLoadingAnything && !!estabelecimentosError && (
        <View style={styles.stateBox}>
          <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
          <Text style={styles.stateText}>{estabelecimentosError}</Text>
          <TouchableOpacity style={styles.stateButton} onPress={onRetryEstabelecimentos}>
            <Text style={styles.stateButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!permissionDenied && !isLoadingAnything && !estabelecimentosError && (
        <>
          <View style={styles.chipsRow}>
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              renderItem={({ item }) => {
                const active = activeCategory === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => onSelectCategory(item.id)}
                  >
                    <Ionicons name={item.icon} size={15} color={active ? '#fff' : colors.blue} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          <FlatList
            data={estabelecimentos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Próximos de você</Text>}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.blue]} tintColor={colors.blue} />
            }
            renderItem={({ item }) => (
              <EstabelecimentoCard
                estabelecimento={item}
                onPress={() => navigation.navigate('EstablishmentDetail', { gym: item })}
              />
            )}
            // Infinite scroll: dispara a busca da próxima página quando o
            // usuário chega perto do fim da lista.
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              <>
                {loadingMore && (
                  <View style={styles.loadingMoreBox}>
                    <ActivityIndicator size="small" color={colors.blue} />
                    <Text style={styles.loadingMoreText}>Carregando mais estabelecimentos...</Text>
                  </View>
                )}

                {/* Banner Premium só aparece quando não há mais páginas pra carregar */}
                {!hasMore && !loadingMore && (
                  <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.9}>
                    <View style={styles.premiumIcon}>
                      <Ionicons name="star" size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.premiumTitle}>Seja Premium</Text>
                      <Text style={styles.premiumSubtitle}>
                        Tenha mais check-ins por dia e desbloqueie benefícios exclusivos.
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            }
          />

          {/*
            View de mapa desativada por enquanto. Mantida comentada para
            reaproveitar quando a funcionalidade for implementada.

            <View style={styles.mapWrap}>
              <View style={styles.mapArea}>
                {estabelecimentos.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.pin, { top: g.coord?.top ?? '50%', left: g.coord?.left ?? '50%' }]}
                    onPress={() => onSelectEstabelecimento(g)}
                  >
                    <Ionicons
                      name="location"
                      size={30}
                      color={g.id === selectedEstabelecimento?.id ? colors.blueDark : colors.blue}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.mapCityLabel}>Londrina</Text>
              </View>

              {selectedEstabelecimento && (
                <TouchableOpacity
                  style={styles.mapCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('EstablishmentDetail', { gym: selectedEstabelecimento })}
                >
                  <Image source={{ uri: selectedEstabelecimento.image }} style={styles.mapCardImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gymName}>{selectedEstabelecimento.name}</Text>
                    <Text style={styles.gymMeta}>
                      {selectedEstabelecimento.distance} • {selectedEstabelecimento.hours}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color={colors.star} />
                      <Text style={styles.ratingText}>
                        {selectedEstabelecimento.rating} ({selectedEstabelecimento.reviews})
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          */}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTitle: { ...typography.h1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { color: colors.blue, fontWeight: '700', fontSize: 13 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 14 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: colors.text },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEEF7',
    borderRadius: radius.pill,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  toggleBtnActive: { backgroundColor: colors.blue },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: '#fff' },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chipsRow: { marginTop: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
  },
  chipActive: { backgroundColor: colors.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.blue },
  chipTextActive: { color: '#fff' },
  sectionTitle: { ...typography.h3, marginBottom: 4 },
  loadingMoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: { fontSize: 12.5, color: colors.textMuted },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 10,
    gap: 12,
    ...shadow,
  },
  gymImage: { width: 64, height: 64, borderRadius: radius.md },
  gymInfo: { flex: 1, gap: 2 },
  gymName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  gymMeta: { fontSize: 12, color: colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.blue,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 6,
  },
  premiumIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  premiumSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  // Estilos do mapa mantidos (usados apenas quando a view de mapa for reativada)
  mapWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16 },
  mapArea: {
    flex: 1,
    backgroundColor: '#E4EAF6',
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mapCityLabel: {
    position: 'absolute',
    top: '38%',
    left: '32%',
    fontSize: 16,
    fontWeight: '700',
    color: '#B9C6E3',
  },
  pin: { position: 'absolute' },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 10,
    marginTop: 12,
    ...shadow,
  },
  mapCardImage: { width: 56, height: 56, borderRadius: radius.md },
});