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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/theme';

const BLUE = colors.blue || '#075BEE';
const INK = '#0C1534';

const SLIDES = [
  {
    title: 'ConexPass',
    subtitle: 'Mais bem-estar\nmais possibilidades',
    caption: 'Acesse academias, estúdios e\nespaços de bem-estar com um só app.',
  },
  {
    title: 'Diversos\nestabelecimentos',
    subtitle: 'Encontre academias, estúdios,\nfuncionais, lutas, dança e\nmuito mais perto de você.',
    image: require('../../assets/estabelecimentos.png'),
  },
  {
    title: 'Planos, pacotes\ne acessos avulsos',
    subtitle: 'Assinatura ConexPass e\ndiferentes opções dos\nestabelecimentos.',
    image: require('../../assets/planos.png'),
  },
  {
    title: 'Mais flexibilidade\nno seu dia a dia',
    subtitle: 'Solicite seu check-in pelo app\ne aproveite com praticidade.',
    image: require('../../assets/checkin.png'),
  },
];

export default function Onboarding({ index = 0, saving = false, onNext, onBack, onSkip }) {
  const { height } = useWindowDimensions();
  const welcome = index === 0;
  const slide = SLIDES[index] || SLIDES[0];

  if (welcome) {
    return (
      <ImageBackground
        source={require('../../assets/welcome.jpg')}
        resizeMode="cover"
        style={styles.welcome}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0B2235" />
        <View style={styles.welcomeOverlay} />
        <SafeAreaView style={styles.welcomeContent} edges={['top', 'bottom']}>
          <View style={styles.welcomeCenter}>
            <Text style={styles.welcomeLogo}>{slide.title}</Text>
            <Text style={styles.welcomeSubtitle}>{slide.subtitle}</Text>
          </View>
          <View style={styles.welcomeBottom}>
            <TouchableOpacity
              onPress={onNext}
              disabled={saving}
              style={styles.welcomeButton}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.welcomeButtonText}>Começar</Text>
            </TouchableOpacity>
            <Text style={styles.welcomeCaption}>{slide.caption}</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const compact = height < 690;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.main}>
        <View style={[styles.artContainer, compact && styles.artContainerCompact]}>
          <Image source={slide.image} style={styles.illustration} resizeMode="contain" />
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
            <Text style={styles.nextText}>{index === 3 ? 'Começar' : 'Próximo'}</Text>
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
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  artContainer: { width: '100%', height: 280, marginBottom: 26, alignItems: 'center' },
  artContainerCompact: { height: 210, marginBottom: 12 },
  illustration: { width: '100%', height: '100%' },
  title: { color: INK, fontSize: 25, lineHeight: 31, fontWeight: '800', textAlign: 'center', letterSpacing: -0.6 },
  subtitle: { color: '#24304B', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 16 },
  dots: { flexDirection: 'row', gap: 9, marginTop: 33, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D7E2F1' },
  activeDot: { backgroundColor: BLUE },
  footer: { paddingHorizontal: 23, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skipHit: { paddingVertical: 14, paddingHorizontal: 7 },
  skip: { color: '#8993A5', fontSize: 13 },
  nextButton: { backgroundColor: BLUE, borderRadius: radius.md ?? 10, minWidth: 113, height: 46, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  nextText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  backHit: { position: 'absolute', left: 12, top: 8, padding: 8 },
  welcome: { flex: 1, backgroundColor: '#0B2235' },
  welcomeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 19, 36, 0.56)' },
  welcomeContent: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 30 },
  welcomeCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeLogo: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  welcomeSubtitle: { color: '#FFFFFF', textAlign: 'center', fontSize: 19, lineHeight: 26, marginTop: 21 },
  welcomeBottom: { paddingBottom: 17 },
  welcomeButton: { backgroundColor: '#FFFFFF', height: 53, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  welcomeButtonText: { color: '#09152A', fontSize: 15, fontWeight: '800' },
  welcomeCaption: { color: '#FFFFFF', textAlign: 'center', fontSize: 12, lineHeight: 17, marginTop: 24 },
});
