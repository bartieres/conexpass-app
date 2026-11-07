import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/theme';

const TONES = {
  blue: { gradient: ['#E4EEFF', '#F2F6FF'], icon: colors.blue },
  green: { gradient: ['#E2F3EC', '#F2FAF6'], icon: '#237759' },
  purple: { gradient: ['#EEE7FA', '#F7F3FC'], icon: '#7950A8' },
};

export default function ProfileIntro({
  icon,
  title,
  description,
  tone = 'blue',
}) {
  const palette = TONES[tone] || TONES.blue;
  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={27} color={palette.icon} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  description: { color: '#5D6B80', fontSize: 13, lineHeight: 20, marginTop: 6 },
});
