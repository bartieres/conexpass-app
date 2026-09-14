import { useState, useMemo } from 'react';
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
      'Abra o app, escolha o estabelecimento na tela Explorar e toque em "Fazer check-in". Sua solicitação é enviada para a equipe do local, que confirma sua entrada pelo painel. Você recebe a confirmação assim que o check-in for aprovado.',
  },

  {
    id: 'checkin-confirmacao',
    question: 'O que acontece depois de solicitar um check-in?',
    answer:
      'Após solicitar o check-in, ele fica aguardando a confirmação do estabelecimento. A equipe do local precisa aprovar sua entrada. Assim que o check-in for confirmado, o status será atualizado no aplicativo.',
  },

  {
    id: 'checkin-pendente',
    question: 'Meu check-in está aguardando confirmação',
    answer:
      'Isso significa que sua solicitação foi enviada e ainda não foi aprovada pela equipe do estabelecimento. Aguarde alguns instantes e, se necessário, procure a recepção do local para avisar que você realizou o check-in pelo ConexPass.',
  },

  {
    id: 'checkin-erro',
    question: 'Meu check-in não funcionou',
    answer:
      'Verifique se sua assinatura está ativa, se o estabelecimento está dentro das condições do seu plano e se você está dentro do horário de funcionamento. Se o problema continuar, procure a equipe do estabelecimento ou entre em contato com o Suporte.',
  },

  {
    id: 'checkin-limite',
    question: 'Existe limite de check-ins?',
    answer:
      'O limite de check-ins depende das regras do seu plano. Consulte Perfil > Meu plano para verificar os benefícios e limites disponíveis para sua assinatura.',
  },

  {
    id: 'checkin-cancelar',
    question: 'Posso cancelar um check-in?',
    answer:
      'Se você solicitou um check-in por engano, verifique o status da solicitação no aplicativo. Caso ainda esteja aguardando confirmação, procure a equipe do estabelecimento ou entre em contato com o Suporte.',
  },

  {
    id: 'estabelecimento',
    question: 'Posso usar o ConexPass em qualquer estabelecimento?',
    answer:
      'Você pode utilizar o ConexPass nos estabelecimentos disponíveis no aplicativo e de acordo com as condições do seu plano. Consulte os detalhes de cada estabelecimento antes de realizar o check-in.',
  },

  {
    id: 'estabelecimento-parceiro',
    question: 'Todos os estabelecimentos são parceiros do ConexPass?',
    answer:
      'Não necessariamente. Alguns estabelecimentos podem estar disponíveis para consulta no aplicativo mesmo antes de uma parceria ser estabelecida. O aplicativo informa quando um estabelecimento faz parte da rede de parceiros.',
  },

  {
    id: 'explorar',
    question: 'Como encontrar um estabelecimento?',
    answer:
      'Na tela Explorar, você pode visualizar os estabelecimentos disponíveis e utilizar os filtros para encontrar opções de acordo com sua localização, horário de funcionamento e outras características.',
  },

  {
    id: 'horario',
    question: 'Como saber se um estabelecimento está aberto?',
    answer:
      'Os horários de funcionamento ficam disponíveis nos detalhes de cada estabelecimento. Confira essas informações antes de realizar seu check-in.',
  },

  {
    id: 'plano',
    question: 'Como alterar meu plano?',
    answer:
      'Vá em Perfil > Meu plano para consultar as opções disponíveis. Caso seu plano permita a alteração, você poderá escolher uma nova opção diretamente pelo aplicativo.',
  },

  {
    id: 'plano-como-funciona',
    question: 'Como funciona meu plano?',
    answer:
      'Seu plano define as condições de utilização do ConexPass, incluindo os estabelecimentos e a quantidade de check-ins permitidos conforme a opção contratada. Consulte Perfil > Meu plano para ver os detalhes da sua assinatura.',
  },

  {
    id: 'plano-upgrade',
    question: 'Posso fazer upgrade do meu plano?',
    answer:
      'Sim. Quando houver uma opção superior disponível para sua assinatura, você poderá solicitar o upgrade pelo aplicativo. As condições e a data de alteração serão apresentadas antes da confirmação.',
  },

  {
    id: 'plano-downgrade',
    question: 'Posso fazer downgrade do meu plano?',
    answer:
      'Sim, desde que a opção esteja disponível para sua assinatura. A alteração poderá seguir as regras do ciclo de cobrança vigente. Confira as condições apresentadas no momento da alteração.',
  },

  {
    id: 'pagamento',
    question: 'Como funciona o pagamento?',
    answer:
      'O pagamento do seu plano é realizado de acordo com a periodicidade escolhida na contratação. As informações da sua assinatura e da forma de pagamento ficam disponíveis na área Perfil > Pagamento.',
  },

  {
    id: 'pagamento-falhou',
    question: 'O que acontece se meu pagamento não for aprovado?',
    answer:
      'Caso uma cobrança não seja aprovada, sua assinatura poderá ficar com pagamento pendente e o acesso aos benefícios poderá ser afetado. Verifique sua forma de pagamento em Perfil > Pagamento e, se necessário, atualize os dados para tentar novamente.',
  },

  {
    id: 'pagamento-alterar',
    question: 'Como alterar minha forma de pagamento?',
    answer:
      'Acesse Perfil > Pagamento e verifique as opções disponíveis para atualizar sua forma de pagamento.',
  },

  {
    id: 'cobrança',
    question: 'Onde posso consultar minhas cobranças?',
    answer:
      'Acesse Perfil > Pagamento para consultar as informações relacionadas à sua assinatura e às cobranças realizadas.',
  },

  {
    id: 'cancelar',
    question: 'Como cancelar meu plano?',
    answer:
      'Acesse Perfil > Meu plano e selecione a opção de cancelamento. Antes de confirmar, o aplicativo apresentará as condições relacionadas ao cancelamento da sua assinatura.',
  },

  {
    id: 'cancelamento-acesso',
    question: 'Depois de cancelar, ainda posso usar o ConexPass?',
    answer:
      'O acesso após o cancelamento depende das condições da sua assinatura e do período já contratado. O aplicativo informará a data em que seu acesso será encerrado.',
  },

  {
    id: 'cadastro',
    question: 'Como criar uma conta?',
    answer:
      'Na tela inicial do ConexPass, escolha a opção para criar sua conta e preencha os dados solicitados. Depois de concluir o cadastro, você poderá acessar o aplicativo e conhecer os estabelecimentos disponíveis.',
  },

  {
    id: 'login',
    question: 'Não consigo acessar minha conta',
    answer:
      'Confira se o e-mail e a senha estão corretos. Se você não lembrar sua senha, utilize a opção "Esqueci minha senha" para iniciar a recuperação do acesso.',
  },

  {
    id: 'senha',
    question: 'Esqueci minha senha. O que faço?',
    answer:
      'Na tela de login, toque em "Esqueci minha senha" e siga as instruções para criar uma nova senha.',
  },

  {
    id: 'dados',
    question: 'Como alterar meus dados cadastrais?',
    answer:
      'Acesse Perfil e procure a opção de edição dos seus dados cadastrais. Algumas informações podem exigir validação antes de serem alteradas.',
  },

  {
    id: 'conta-excluir',
    question: 'Como excluir minha conta?',
    answer:
      'Se você deseja excluir sua conta, acesse as opções da sua conta ou entre em contato com o Suporte para solicitar a exclusão e receber as orientações necessárias.',
  },

  {
    id: 'app-atualizacao',
    question: 'Preciso manter o aplicativo atualizado?',
    answer:
      'Recomendamos utilizar sempre a versão mais recente do ConexPass para ter acesso às correções, melhorias e novos recursos disponibilizados.',
  },

  {
    id: 'localizacao',
    question: 'Por que o ConexPass precisa da minha localização?',
    answer:
      'A localização ajuda o aplicativo a apresentar estabelecimentos próximos de você e permite ordenar ou filtrar as opções por distância. Você pode controlar a permissão de localização nas configurações do seu dispositivo.',
  },

  {
    id: 'suporte',
    question: 'Como entrar em contato com o Suporte?',
    answer:
      'Se você não encontrou a resposta para sua dúvida, acesse a opção Suporte no aplicativo para entrar em contato com a equipe do ConexPass.',
  },

  {
    id: 'problema-estabelecimento',
    question: 'O que fazer se o estabelecimento não reconhecer meu check-in?',
    answer:
      'Mostre à equipe do local que você realizou a solicitação pelo ConexPass e verifique se o pedido ainda está aguardando confirmação. Se o problema persistir, entre em contato com o Suporte.',
  },

  {
    id: 'problema-beneficio',
    question: 'Um estabelecimento não aparece para mim. Por quê?',
    answer:
      'A disponibilidade de estabelecimentos pode variar de acordo com sua localização, seu plano e as condições de utilização. Consulte os detalhes do seu plano e os filtros utilizados na tela Explorar.',
  },

  {
    id: 'sem-internet',
    question: 'Posso fazer check-in sem internet?',
    answer:
      'É necessário estar conectado à internet para enviar e acompanhar uma solicitação de check-in pelo aplicativo.',
  },

  {
    id: 'seguranca',
    question: 'Meus dados estão seguros?',
    answer:
      'O ConexPass adota medidas de segurança para proteger os dados dos usuários. Seus dados são utilizados de acordo com as finalidades informadas no aplicativo e na Política de Privacidade.',
  },

  {
    id: 'politica-privacidade',
    question: 'Onde posso consultar a Política de Privacidade?',
    answer:
      'Você pode acessar a Política de Privacidade pelas opções disponíveis no aplicativo.',
  },

  {
    id: 'termos',
    question: 'Onde posso consultar os Termos de Uso?',
    answer:
      'Os Termos de Uso do ConexPass ficam disponíveis nas opções do aplicativo para consulta a qualquer momento.',
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
    <View style={styles.safe}>
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
    </View>
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
