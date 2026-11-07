import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORIES } from '../../data/mock';

const BLUE = colors.blue || '#075BEE';
const INK = '#0C1534';
const WELCOME_ACTIVITIES = CATEGORIES.filter((category) =>
  ['ACADEMIA', 'PILATES', 'NATACAO', 'LUTA'].includes(category.id)
);

const SLIDES = [
  {
    title: 'ConexPass',
    subtitle: 'Mais bem-estar\nmais possibilidades',
    caption:
      'Acesse academias, estúdios e\nespaços de bem-estar com um só app.',
  },
  {
    title: 'Diversos\nestabelecimentos',
    subtitle:
      'Encontre academias, estúdios,\nfuncionais, lutas, dança e\nmuito mais perto de você.',
    image: require('../../assets/estabelecimentos.png'),
  },
  {
    title: 'Planos, pacotes\ne acessos avulsos',
    subtitle:
      'Assinatura ConexPass e\ndiferentes opções dos\nestabelecimentos.',
    image: require('../../assets/planos.png'),
  },
  {
    title: 'Mais flexibilidade\nno seu dia a dia',
    subtitle: 'Solicite seu check-in pelo app\ne aproveite com praticidade.',
    image: require('../../assets/checkin.png'),
  },
];

export default function Onboarding({
  index = 0,
  saving = false,
  onNext,
  onBack,
  onSkip,
}) {
  const { height, width } = useWindowDimensions();
  const welcomeCompact = height < 740 || width < 360;
  const welcome = index === 0;
  const slide = SLIDES[index] || SLIDES[0];

  if (welcome) {
    return (
      <ImageBackground
        source={require('../../assets/welcome.png')}
        resizeMode="cover"
        style={styles.welcome}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0B2235" />
        <LinearGradient
          colors={[
            '#003B78',
            'rgba(0, 46, 96, 0.96)',
            'rgba(0, 38, 79, 0.68)',
            'rgba(0, 38, 79, 0)',
          ]}
          locations={[0, 0.3, 0.65, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.welcomeOverlay}
          pointerEvents="none"
        />
        <SafeAreaView
          style={styles.welcomeContent}
          edges={['top', 'bottom', 'left', 'right']}
        >
          <ScrollView
            contentContainerStyle={styles.welcomeScroll}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.welcomeCenter,
                welcomeCompact && styles.welcomeCenterCompact,
              ]}
            >
              <Image
                source={require('../../assets/logo_conexpass.png')}
                style={[
                  styles.welcomeSymbol,
                  welcomeCompact && styles.welcomeSymbolCompact,
                ]}
                resizeMode="contain"
                accessible={false}
              />

            </View>
            <View style={styles.welcomeBottom}>
              {/*<View>
                <Text
                  style={[
                    styles.welcomeHeadline,
                    welcomeCompact && styles.welcomeHeadlineCompact,
                  ]}
                >
                  Mais bem-estar,{'\n'}mais{' '}
                  <Text style={styles.welcomeAccent}>possibilidades</Text>
                </Text>
                <View style={styles.welcomeUnderline} />
              </View>
              <View style={styles.welcomeActivities}>
                {WELCOME_ACTIVITIES.map((activity) => (
                  <View key={activity.id} style={styles.welcomeActivity}>
                    <Ionicons
                      name={activity.icon}
                      size={welcomeCompact ? 24 : 28}
                      color="#71D9FF"
                    />
                    <Text style={styles.welcomeActivityText}>
                      {activity.label}
                    </Text>
                  </View>
                ))}
              </View>*/}
              <TouchableOpacity
                onPress={onNext}
                disabled={saving}
                style={[
                  styles.welcomeButton,
                  saving && styles.welcomeButtonDisabled,
                ]}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Começar"
                accessibilityState={{ disabled: saving, busy: saving }}
              >
                <LinearGradient
                  colors={['#09ADEE', BLUE]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.welcomeButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.welcomeButtonText}>Começar</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={23}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.welcomeCaption}>{slide.caption}</Text>
              <View
                style={styles.welcomeDots}
                accessibilityLabel="Etapa 1 de 4"
              >
                {SLIDES.map((_, dotIndex) => (
                  <View
                    key={dotIndex}
                    style={[
                      styles.welcomeDot,
                      dotIndex === 0 && styles.welcomeDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const compact = height < 690;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.main}>
        <View
          style={[styles.artContainer, compact && styles.artContainerCompact]}
        >
          <Image
            source={slide.image}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((dotIndex) => (
            <View
              key={dotIndex}
              style={[styles.dot, dotIndex === index && styles.activeDot]}
            />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onSkip}
          disabled={saving}
          style={styles.skipHit}
          accessibilityRole="button"
        >
          <Text style={styles.skip}>Pular</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          disabled={saving}
          style={styles.nextButton}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextText}>
              {index === 3 ? 'Começar' : 'Próximo'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {index > 1 && (
        <TouchableOpacity
          onPress={onBack}
          disabled={saving}
          style={styles.backHit}
          accessibilityLabel="Voltar slide"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" color="#98A1B3" size={20} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  artContainer: {
    width: '100%',
    height: 280,
    marginBottom: 26,
    alignItems: 'center',
  },
  artContainerCompact: { height: 210, marginBottom: 12 },
  illustration: { width: '100%', height: '100%' },
  title: {
    color: INK,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#24304B',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 16,
  },
  dots: { flexDirection: 'row', gap: 9, marginTop: 33, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D7E2F1' },
  activeDot: { backgroundColor: BLUE },
  footer: {
    paddingHorizontal: 23,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipHit: { paddingVertical: 14, paddingHorizontal: 7 },
  skip: { color: '#8993A5', fontSize: 13 },
  nextButton: {
    backgroundColor: BLUE,
    borderRadius: radius.md ?? 10,
    minWidth: 113,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  nextText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  backHit: { position: 'absolute', left: 12, top: 8, padding: 8 },
  welcome: { flex: 1, backgroundColor: '#0B2235' },
  welcomeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
  },
  welcomeContent: { flex: 1 },
  welcomeScroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  welcomeCenter: {
    flex: 1,
    minHeight: 230,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 36,
  },
  welcomeCenterCompact: { minHeight: 150, paddingTop: 20, paddingBottom: 24 },
  welcomeSymbol: {
    height: 130,
    tintColor: '#FFFFFF',
    marginBottom: 10,
  },
  welcomeSymbolCompact: { width: 42, height: 54 },
  welcomeLogo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 2,
  },
  welcomeAccent: { color: '#28C5FF' },
  welcomeBottom: { gap: 22 },
  welcomeHeadline: {
    color: '#FFFFFF',
    fontSize: 33,
    lineHeight: 41,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  welcomeHeadlineCompact: { fontSize: 28, lineHeight: 36 },
  welcomeUnderline: {
    height: 4,
    width: 92,
    borderRadius: 4,
    backgroundColor: '#28C5FF',
    marginTop: 14,
  },
  welcomeActivities: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  welcomeActivity: {
    flex: 1,
    minWidth: 0,
    minHeight: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(126, 195, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 218, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  welcomeActivityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeButton: { borderRadius: 22, overflow: 'hidden' },
  welcomeButtonDisabled: { opacity: 0.65 },
  welcomeButtonGradient: {
    minHeight: 58,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  welcomeButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  welcomeCaption: {
    color: '#DFEAF6',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  welcomeDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    paddingBottom: 4,
  },
  welcomeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(204, 226, 247, 0.3)',
  },
  welcomeDotActive: { backgroundColor: '#28C5FF', width: 22 },
});
