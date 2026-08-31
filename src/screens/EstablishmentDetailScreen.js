import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme/theme';
import { GYMS } from '../data/mock';

const AMENITY_ICONS = {
  'Wi-Fi': 'wifi-outline',
  Vestiário: 'shirt-outline',
  Estacionamento: 'car-outline',
  'Ar-cond.': 'snow-outline',
};

export default function EstablishmentDetailScreen({ route, navigation }) {
  const gym = route.params?.gym || GYMS[0];
  const [favorite, setFavorite] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: gym.image }} style={styles.image} />
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.roundButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.roundButton}>
                <Ionicons name="share-outline" size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundButton} onPress={() => setFavorite((f) => !f)}>
                <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={favorite ? '#EF4444' : colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>{gym.hours}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{gym.name}</Text>
          <Text style={styles.category}>{gym.category}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color={colors.star} />
            <Text style={styles.ratingText}>
              {gym.rating} ({gym.reviews} avaliações)
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.distanceText}>{gym.distance}</Text>
          </View>

          <View style={styles.amenitiesRow}>
            {gym.amenities.map((a) => (
              <View key={a} style={styles.amenityItem}>
                <View style={styles.amenityIconWrap}>
                  <Ionicons name={AMENITY_ICONS[a] || 'checkmark-circle-outline'} size={18} color={colors.blue} />
                </View>
                <Text style={styles.amenityLabel}>{a}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.aboutText}>{gym.about}</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Ver mais</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Endereço</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressText}>{gym.address}</Text>
            <Ionicons name="navigate-circle-outline" size={22} color={colors.blue} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkinButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CheckInScreen', { gym })}
        >
          <Ionicons name="qr-code-outline" size={18} color="#fff" />
          <Text style={styles.checkinButtonText}>Fazer Check-in</Text>
        </TouchableOpacity>
      </View>
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
  openBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 10 },
  name: { ...typography.h1, fontSize: 22 },
  category: { ...typography.muted, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  ratingText: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  dot: { color: colors.textLight },
  distanceText: { fontSize: 13, color: colors.textMuted },
  amenitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  amenityItem: { alignItems: 'center', gap: 6, flex: 1 },
  amenityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { ...typography.h3, marginTop: 20, marginBottom: 8 },
  aboutText: { ...typography.body, color: colors.textMuted, lineHeight: 20 },
  linkText: { color: colors.blue, fontWeight: '700', fontSize: 13, marginTop: 6 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
  },
  addressText: { flex: 1, fontSize: 13, color: colors.text, marginRight: 10, lineHeight: 18 },
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
});
