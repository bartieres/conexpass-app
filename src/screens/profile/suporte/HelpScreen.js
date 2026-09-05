import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../../theme/theme';

// Habilita animação de layout no Android (iOS já tem por padrão)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Conteúdo das dúvidas — 100% local, sem chamada ao backend. Pra adicionar
 * uma nova pergunta, é só incluir um item aqui.
 */
const FAQS = [
  {
    id: 'checkin',
    question: 'Como fazer um check-in?',
    answer:
      'Abra o app, escolha o estabelecimento na tela Explorar e toque em "Fazer check-in". Sua solicitação é enviada na hora para a recepção do local, que confirma sua entrada pelo painel deles. Você recebe a confirmação assim que for aprovado.',
  },
  {
    id: 'plano',
    question: 'Como alterar meu plano?',
    answer:
      'Vá em Perfil > Meu plano para ver as opções disponíveis. Você pode fazer upgrade ou downgrade a qualquer momento; a mudança entra em vigor no próximo ciclo de cobrança.',
  },
  {
    id: 'pagamento',
    question: 'Como funciona o pagamento?',
    answer:
      'A cobrança do seu plano é feita automaticamente todo mês, na mesma data da sua assinatura. Você pode conferir e alterar a forma de pagamento em Perfil > Pagamento.',
  },
  {
    id: 'cancelar',
    question: 'Como cancelar meu plano?',
    answer:
      'Vá em Perfil > Meu plano e toque em "Cancelar assinatura". Seu acesso continua ativo até o fim do período já pago, sem multa ou taxa de cancelamento.',
  },
  {
    id: 'checkin-erro',
    question: 'Meu check-in não funcionou',
    answer:
      'Confirme se você está dentro do horário de funcionamento do estabelecimento e se sua assinatura está ativa. Se o problema continuar, a recepção do local pode não ter visto a solicitação ainda — tente reenviar ou fale com a equipe presencialmente. Se mesmo assim não resolver, fale com a gente pelo Suporte.',
  },
];

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos pra busca mais tolerante
}

function FaqItem({ item, expanded, onToggle }) {
  return (
    <View style={[styles.faqItem, expanded && styles.faqItemExpanded]}>
      <TouchableOpacity style={styles.faqQuestionRow} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textLight} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.faqAnswerBox}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpCenterScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const faqsFiltradas = useMemo(() => {
    const termo = normalizar(search.trim());
    if (!termo) return FAQS;
    return FAQS.filter(
      (faq) => normalizar(faq.question).includes(termo) || normalizar(faq.answer).includes(termo)
    );
  }, [search]);

  const handleToggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((atual) => (atual === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Central de ajuda</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.heroTitle}>Como podemos ajudar?</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar uma dúvida"
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          {search.trim() ? 'Resultados' : 'Principais dúvidas'}
        </Text>

        {faqsFiltradas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="help-circle-outline" size={32} color={colors.textLight} />
            <Text style={styles.emptyText}>Nenhum resultado para "{search}"</Text>
          </View>
        ) : (
          <View style={styles.faqList}>
            {faqsFiltradas.map((item) => (
              <FaqItem
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => handleToggle(item.id)}
              />
            ))}
          </View>
        )}
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
    paddingTop: 54,
    paddingBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  body: { padding: 20, paddingTop: 4 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },
  faqList: { gap: 10 },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    ...shadow,
  },
  faqItemExpanded: {},
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 10,
  },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  faqAnswerBox: {
    paddingBottom: 16,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  faqAnswer: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: 10 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 13, color: colors.textLight, textAlign: 'center' },
});
