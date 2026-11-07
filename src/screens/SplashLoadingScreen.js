import {
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
  Text,
  Pressable,
} from 'react-native';
import { colors } from '../theme/theme';
import Logo from '../assets/logo_conexpass.png';

export default function SplashLoadingScreen({ error, onRetry }) {
  return (
    <View style={styles.container}>
      <Image source={Logo} style={{ height: 130, resizeMode: 'contain' }} />
      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </>
      ) : (
        <ActivityIndicator
          size="small"
          color={colors.blue}
          style={{ marginTop: 18 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.text, textAlign: 'center', margin: 24 },
  retry: { backgroundColor: colors.blue, padding: 14, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: { fontSize: 22, fontWeight: '800', color: colors.blue },
});
