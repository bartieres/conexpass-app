import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileIntro from '../components/ProfileIntro';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../../../theme/theme';

export default function SecurityScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <ProfileIntro
          icon="shield-checkmark-outline"
          title="Cuide do seu acesso"
          description="Gerencie sua senha e as opções de segurança da sua conta."
          tone="blue"
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="key-outline" size={19} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>Senha</Text>
                  <Text style={styles.menuSubLabel}>Alterar senha</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessões</Text>
          <View style={styles.sectionCard}>
            {/*
              TODO: ainda não existe a tela de dispositivos conectados.
              O item já fica visível na UI (conforme pedido), mas
              desabilitado — sem navegação e com aparência esmaecida —
              até a tela ser implementada.
            */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDisabled]}
              disabled
              activeOpacity={1}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={19}
                    color={colors.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, styles.menuLabelDisabled]}>
                    Dispositivos conectados
                  </Text>
                  <Text style={styles.menuSubLabel}>Em breve</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'center',
  },
  body: { paddingBottom: 32, padding: 16, paddingTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuItemDisabled: { opacity: 0.55 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
  menuLabelDisabled: { color: colors.textMuted },
  menuSubLabel: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});
