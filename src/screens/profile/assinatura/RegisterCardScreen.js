import { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../../../theme/theme';

import { save } from '../../../services/formaPagamentoService';

const BANDEIRA_ICON = {
  VISA: 'card',
  MASTERCARD: 'card',
  ELO: 'card',
};

const identificarBandeira = (numero) => {
  const n = numero.replace(/\D/g, '');

  if (!n) {
    return null;
  }

  // Visa
  if (/^4/.test(n)) {
    return 'VISA';
  }

  // Mastercard
  if (/^(5[1-5])/.test(n) || /^(22[2-9]|2[3-6]|27[0-1]|2720)/.test(n)) {
    return 'MASTERCARD';
  }

  // Elo - principais faixas
  const eloRanges = [
    /^4011/,
    /^431274/,
    /^438935/,
    /^451416/,
    /^457393/,
    /^4576/,
    /^504175/,
    /^5067/,
    /^627780/,
    /^636368/,
    /^636297/,
    /^650031/,
    /^650032/,
    /^650033/,
    /^650035/,
    /^650036/,
    /^650037/,
    /^650038/,
    /^650039/,
    /^65004/,
    /^65005/,
    /^65007/,
    /^65009/,
    /^65041/,
    /^65042/,
    /^65043/,
    /^65048/,
    /^65049/,
    /^6505/,
    /^6507/,
    /^6509/,
    /^6516/,
    /^6550/,
  ];

  if (eloRanges.some((regex) => regex.test(n))) {
    return 'ELO';
  }

  return null;
};

const nomeBandeira = (bandeira) => {
  switch (bandeira) {
    case 'VISA':
      return 'Visa';

    case 'MASTERCARD':
      return 'Mastercard';

    case 'ELO':
      return 'Elo';

    default:
      return null;
  }
};

export default function RegisterCardScreen({ navigation }) {
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');

  const [bandeira, setBandeira] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatarNumero = (value) => {
    const somenteNumeros = value.replace(/\D/g, '').slice(0, 19);

    return somenteNumeros.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatarValidade = (value) => {
    const somenteNumeros = value.replace(/\D/g, '').slice(0, 4);

    if (somenteNumeros.length > 2) {
      return `${somenteNumeros.slice(0, 2)}/${somenteNumeros.slice(2)}`;
    }

    return somenteNumeros;
  };

  const handleNumeroChange = (value) => {
    const numeroFormatado = formatarNumero(value);

    setNumero(numeroFormatado);
    setBandeira(identificarBandeira(numeroFormatado));
  };

  const validar = () => {
    const numeroLimpo = numero.replace(/\D/g, '');

    if (numeroLimpo.length < 13) {
      Alert.alert('Cartão inválido', 'Informe um número de cartão válido.');

      return false;
    }

    if (!nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome impresso no cartão.');

      return false;
    }

    if (validade.length !== 5) {
      Alert.alert('Validade inválida', 'Informe a validade no formato MM/AA.');

      return false;
    }

    const [mes, ano] = validade.split('/');

    const mesNumero = Number(mes);

    if (!mes || !ano || mesNumero < 1 || mesNumero > 12) {
      Alert.alert('Validade inválida', 'Informe uma data de validade válida.');

      return false;
    }

    if (cvv.length < 3) {
      Alert.alert('CVV inválido', 'Informe o código de segurança do cartão.');

      return false;
    }

    return true;
  };

  const handleSalvar = async () => {
    if (!validar()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const numeroCartao = numero.replace(/\D/g, '');

      /*
       * IMPORTANTE:
       *
       * Este é o ponto onde deverá entrar a tokenização
       * do gateway escolhido.
       *
       * O fluxo de produção deve ser:
       *
       * 1. App coleta número, validade e CVV.
       * 2. App envia os dados diretamente para o gateway
       *    através do mecanismo de tokenização disponibilizado.
       * 3. Gateway retorna um token/card_id.
       * 4. App envia somente o token para o seu backend.
       *
       * O backend NÃO deve receber:
       *
       * - número completo do cartão
       * - CVV
       *
       * Exemplo futuro:
       *
       * const token = await tokenizarCartao({
       *   number: numeroCartao,
       *   holder_name: nome.trim().toUpperCase(),
       *   expiration_date: validade,
       *   cvv,
       * });
       *
       * await save({
       *   tipo: 'CREDIT_CARD',
       *   token: token.id,
       * });
       *
       * Por enquanto o save abaixo mantém a integração atual
       * para você conseguir testar o fluxo do MVP.
       */

      const payload = {
        tipo: 'CREDIT_CARD',
        cartao: {
          bandeira: bandeira,
          ultimosDigitos: numeroCartao,
          titularCartao: nome.trim().toUpperCase(),
          validade,
          cvv,
        },
      };

      await save(payload);

      Alert.alert(
        'Cartão cadastrado!',
        'Seu cartão foi cadastrado e já pode ser usado nas próximas cobranças.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      setError(
        err.friendlyMessage ||
          'Não foi possível cadastrar o cartão. Confira os dados e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cadastrar cartão</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <View style={styles.infoIcon}>
            <Ionicons name="card-outline" size={24} color={colors.blue} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Cartão de crédito</Text>

            <Text style={styles.infoText}>
              Cadastre um cartão para utilizar nas cobranças da sua assinatura.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dados do cartão</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Número do cartão</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name={BANDEIRA_ICON[bandeira] || 'card-outline'}
                size={20}
                color={bandeira ? colors.blue : colors.textMuted}
              />

              <TextInput
                style={styles.input}
                value={numero}
                onChangeText={handleNumeroChange}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                maxLength={23}
              />
            </View>

            {!!bandeira && (
              <Text style={styles.cardBrand}>{nomeBandeira(bandeira)}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nome no cartão</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome impresso no cartão"
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Validade</Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.input}
                  value={validade}
                  onChangeText={(value) => setValidade(formatarValidade(value))}
                  placeholder="MM/AA"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>CVV</Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.input}
                  value={cvv}
                  onChangeText={(value) =>
                    setCvv(value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="123"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />

            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.securityBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={colors.blue}
          />

          <Text style={styles.securityText}>
            Seus dados de pagamento são processados de forma segura pelo nosso
            provedor de pagamentos.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />

              <Text style={styles.saveButtonText}>Salvar cartão</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

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

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  body: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 26,
    ...shadow,
  },

  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  infoText: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },

  form: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 18,
    ...shadow,
  },

  field: {
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 7,
  },

  inputWrapper: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: '#fff',
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.text,
  },

  cardBrand: {
    fontSize: 11.5,
    color: colors.blue,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 4,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 16,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    flex: 1,
  },

  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 4,
  },

  securityText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.textLight,
    lineHeight: 16,
  },

  saveButton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
