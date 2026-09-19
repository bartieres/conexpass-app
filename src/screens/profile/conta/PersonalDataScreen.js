import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow } from '../../../theme/theme';
import { useAuth } from '../../../context/AuthContext';
import { findById, updateProfile } from '../../../services/usuarioService';
import { findAll as findAllEstados } from '../../../services/estadoService';
import { findAllByEstadoId } from '../../../services/cidadeService';

function maskPhone(value = '') {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function maskCep(value = '') {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

// Sexo pode vir como string simples ('M') ou como objeto { codigo, descricao },
// dependendo de como o backend serializa. Cobrindo os dois formatos.
function formatSexo(sexo) {
  if (!sexo) return '';
  if (typeof sexo === 'string') {
    if (sexo === 'M') return 'Masculino';
    if (sexo === 'F') return 'Feminino';
    return sexo;
  }
  return sexo.descricao || sexo.codigo || '';
}

// Campo somente leitura, com o mesmo visual dos inputs editáveis, mas sem
// permitir edição (nome, e-mail, CPF, sexo).
function ReadOnlyField({ icon, label, value }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, styles.inputBoxDisabled]}>
        <Ionicons name={icon} size={18} color={colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} value={value} editable={false} />
      </View>
    </View>
  );
}

// Seletor tipo "select" — já que RN não tem um nativo. Mesma ideia usada no
// assunto do "Fale conosco": um campo que parece input, mas abre uma lista
// em modal ao tocar.
function SelectField({ icon, label, placeholder, value, onPress, disabled, loading }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputBox, disabled && styles.inputBoxDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={18} color={colors.textLight} style={styles.inputIcon} />
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.blue} />
        ) : (
          <Ionicons name="chevron-down" size={18} color={colors.textLight} />
        )}
      </TouchableOpacity>
    </View>
  );
}

function SelectModal({ visible, title, options, onSelect, onClose, getLabel, getKey }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {options.length === 0 && (
              <Text style={styles.modalEmptyText}>Nenhuma opção disponível.</Text>
            )}
            {options.map((option) => (
              <TouchableOpacity
                key={getKey(option)}
                style={styles.modalOption}
                onPress={() => onSelect(option)}
              >
                <Text style={styles.modalOptionText}>{getLabel(option)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function valoresVaziosPadrao() {
  return {
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    estadoId: null,
    cidadeId: null,
  };
}

export default function PersonalDataScreen({ navigation }) {
  const { updateUser } = useAuth();

  // Perfil completo vindo do backend — inclui campos que o AuthContext não
  // tem (ex: endereço). É a fonte de verdade dessa tela, não o AuthContext.
  const [usuario, setUsuario] = useState(null);
  const [loadingUsuario, setLoadingUsuario] = useState(true);
  const [usuarioError, setUsuarioError] = useState('');

  // Campos editáveis — começam vazios e são preenchidos assim que o GET
  // do perfil completo responde (ver useEffect logo abaixo).
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [cidadeSelecionada, setCidadeSelecionada] = useState(null);

  // Guarda o "estado inicial" do formulário pra comparar depois e decidir
  // se o botão Salvar deve ficar habilitado (só quando algo mudou de fato).
  const valoresIniciaisRef = useRef(valoresVaziosPadrao());

  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [estadoModalVisible, setEstadoModalVisible] = useState(false);
  const [cidadeModalVisible, setCidadeModalVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const buscarPerfil = useCallback(async () => {
    setLoadingUsuario(true);
    setUsuarioError('');
    try {
      const data = await findById();
      setUsuario(data.response ?? data);
    } catch (err) {
      setUsuarioError(err.friendlyMessage || 'Não foi possível carregar seus dados.');
    } finally {
      setLoadingUsuario(false);
    }
  }, []);

  // useFocusEffect (em vez de useEffect simples) refaz a busca toda vez que
  // a tela ganha foco — não só na primeira vez que é montada.
  useFocusEffect(
    useCallback(() => {
      buscarPerfil();
    }, [buscarPerfil])
  );

  // Assim que o perfil completo chega do backend, preenche os campos do
  // formulário e define o "ponto de partida" pra comparação de mudanças.
  useEffect(() => {
    if (!usuario) return;

    const valoresIniciais = {
      telefone: usuario.telefone ? maskPhone(usuario.telefone) : '',
      cep: usuario.endereco?.cep ? maskCep(usuario.endereco.cep) : '',
      logradouro: usuario.endereco?.logradouro || '',
      numero: usuario.endereco?.numero || '',
      complemento: usuario.endereco?.complemento || '',
      bairro: usuario.endereco?.bairro || '',
      estadoId: usuario.endereco?.cidade?.estado?.id ?? null,
      cidadeId: usuario.endereco?.cidade?.id ?? null,
    };

    setTelefone(valoresIniciais.telefone);
    setCep(valoresIniciais.cep);
    setLogradouro(valoresIniciais.logradouro);
    setNumero(valoresIniciais.numero);
    setComplemento(valoresIniciais.complemento);
    setBairro(valoresIniciais.bairro);
    setEstadoSelecionado(usuario.endereco?.cidade?.estado || null);
    setCidadeSelecionada(usuario.endereco?.cidade || null);

    valoresIniciaisRef.current = valoresIniciais;
  }, [usuario]);

  // Busca a lista de estados — mesma chamada usada no cadastro de
  // estabelecimento do painel web.
  useEffect(() => {
    (async () => {
      setLoadingEstados(true);
      try {
        const data = await findAllEstados();
        setEstados(data.response ?? []);
      } catch (err) {
        // não trava a tela por isso — o usuário só não vai conseguir trocar
        // de estado/cidade até tentar de novo
      } finally {
        setLoadingEstados(false);
      }
    })();
  }, []);

  // Toda vez que o estado selecionado muda, busca as cidades daquele estado
  // — mesma lógica em cascata do formulário web (estado -> cidade). Isso
  // roda tanto quando o usuário troca manualmente quanto quando o estado
  // vem pré-selecionado do perfil carregado.
  useEffect(() => {
    if (!estadoSelecionado?.id) {
      setCidades([]);
      return;
    }

    (async () => {
      setLoadingCidades(true);
      try {
        const data = await findAllByEstadoId(estadoSelecionado.id);
        setCidades(data.response ?? []);
      } catch (err) {
        setCidades([]);
      } finally {
        setLoadingCidades(false);
      }
    })();
  }, [estadoSelecionado?.id]);

  const handleSelecionarEstado = (estado) => {
    setEstadoModalVisible(false);
    if (estado.id === estadoSelecionado?.id) return;
    setEstadoSelecionado(estado);
    // Cidade não pertence mais ao estado novo, então limpa a seleção.
    setCidadeSelecionada(null);
  };

  const handleSelecionarCidade = (cidade) => {
    setCidadeModalVisible(false);
    setCidadeSelecionada(cidade);
  };

  // Botão Salvar só fica ativo quando algum campo realmente mudou em
  // relação ao que veio carregado — evita salvar "nada" à toa.
  const isDirty = useMemo(() => {
    const inicial = valoresIniciaisRef.current;
    return (
      telefone !== inicial.telefone ||
      cep !== inicial.cep ||
      logradouro !== inicial.logradouro ||
      numero !== inicial.numero ||
      complemento !== inicial.complemento ||
      bairro !== inicial.bairro ||
      (estadoSelecionado?.id ?? null) !== inicial.estadoId ||
      (cidadeSelecionada?.id ?? null) !== inicial.cidadeId
    );
  }, [telefone, cep, logradouro, numero, complemento, bairro, estadoSelecionado, cidadeSelecionada]);

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);
    try {
      const payload = {
        telefone,
        endereco: {
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade: cidadeSelecionada ? { id: cidadeSelecionada.id } : null,
        },
      };

      const updated = await updateProfile(payload);
      const usuarioAtualizado = updated?.response ?? updated;

      // Atualiza o objeto completo local (fonte de verdade dessa tela)...
      setUsuario((atual) => ({ ...atual, ...usuarioAtualizado, ...payload, endereco: { ...payload.endereco, cidade: cidadeSelecionada } }));

      // ...e também o AuthContext, já que outras telas do app dependem dele
      // (ex: exibir telefone em algum resumo) sem precisar de um novo GET.
      updateUser?.({
        telefone: usuarioAtualizado?.telefone ?? telefone,
        endereco: usuarioAtualizado?.endereco ?? { ...payload.endereco, cidade: cidadeSelecionada },
      });

      // O que acabou de ser salvo vira o novo "ponto de partida" — assim o
      // botão Salvar desabilita de novo até a próxima alteração.
      valoresIniciaisRef.current = {
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        estadoId: estadoSelecionado?.id ?? null,
        cidadeId: cidadeSelecionada?.id ?? null,
      };

      setSuccessMessage('Dados atualizados com sucesso!');
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Não foi possível salvar suas alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUsuario && !usuario) {
    return (
      <SafeAreaView style={[styles.safe, styles.centerAll]}>
        <ActivityIndicator size="small" color={colors.blue} />
      </SafeAreaView>
    );
  }

  if (!loadingUsuario && !!usuarioError && !usuario) {
    return (
      <SafeAreaView style={[styles.safe, styles.centerAll]}>
        <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
        <Text style={[styles.stateText, { marginTop: 10 }]}>{usuarioError}</Text>
        <TouchableOpacity style={styles.stateButton} onPress={buscarPerfil}>
          <Text style={styles.stateButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const podeSalvar = isDirty && !saving;

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dados pessoais</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Dados pessoais</Text>
        <ReadOnlyField icon="person-outline" label="Nome completo" value={usuario.nome} />
        <ReadOnlyField icon="mail-outline" label="E-mail" value={usuario.email} />
        <ReadOnlyField icon="card-outline" label="CPF" value={usuario.documento} />
        <ReadOnlyField icon="body-outline" label="Sexo" value={formatSexo(usuario.sexo)} />

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Contato</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <View style={styles.inputBox}>
            <Ionicons name="call-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={telefone}
              onChangeText={(v) => setTelefone(maskPhone(v))}
              placeholder="(00) 00000-0000"
              keyboardType="numeric"
              maxLength={15}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Endereço</Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>CEP</Text>
            <View style={styles.inputBox}>
              <Ionicons name="location-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={cep}
                onChangeText={(v) => setCep(maskCep(v))}
                placeholder="00000-000"
                keyboardType="numeric"
                maxLength={9}
              />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <SelectField
              icon="map-outline"
              label="Estado"
              placeholder="Selecione"
              value={estadoSelecionado?.nome}
              onPress={() => setEstadoModalVisible(true)}
              loading={loadingEstados}
            />
          </View>
          <View style={{ flex: 1.6 }}>
            <SelectField
              icon="business-outline"
              label="Cidade"
              placeholder={estadoSelecionado ? 'Selecione' : 'Escolha o estado antes'}
              value={cidadeSelecionada?.nome}
              onPress={() => setCidadeModalVisible(true)}
              disabled={!estadoSelecionado}
              loading={loadingCidades}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bairro</Text>
          <View style={styles.inputBox}>
            <Ionicons name="location-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} value={bairro} onChangeText={setBairro} placeholder="Bairro" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Logradouro</Text>
          <View style={styles.inputBox}>
            <Ionicons name="home-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={logradouro}
              onChangeText={setLogradouro}
              placeholder="Rua, avenida..."
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Número</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={[styles.input, { paddingLeft: 4 }]}
                value={numero}
                onChangeText={setNumero}
                placeholder="Nº"
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.label}>Complemento</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={[styles.input, { paddingLeft: 4 }]}
                value={complemento}
                onChangeText={setComplemento}
                placeholder="Apto, bloco..."
              />
            </View>
          </View>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        {!!successMessage && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, !podeSalvar && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!podeSalvar}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar alterações</Text>}
        </TouchableOpacity>
      </ScrollView>

      <SelectModal
        visible={estadoModalVisible}
        title="Selecione o estado"
        options={estados}
        getKey={(e) => e.id}
        getLabel={(e) => e.nome}
        onSelect={handleSelecionarEstado}
        onClose={() => setEstadoModalVisible(false)}
      />

      <SelectModal
        visible={cidadeModalVisible}
        title="Selecione a cidade"
        options={cidades}
        getKey={(c) => c.id}
        getLabel={(c) => c.nome}
        onSelect={handleSelecionarCidade}
        onClose={() => setCidadeModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  centerAll: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 4 },
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
  body: { padding: 20, paddingTop: 4, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 4,
  },

  row: { flexDirection: 'row', gap: 12 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 50,
  },
  inputBoxDisabled: { backgroundColor: '#F1F3F8' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: colors.text },

  selectText: { flex: 1, fontSize: 14, color: colors.text, marginRight: 6 },
  selectPlaceholder: { color: colors.textLight },

  stateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  stateButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 10,
  },
  stateButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 14,
  },
  errorText: { color: '#DC2626', fontSize: 12.5, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 14,
  },
  successText: { color: colors.success, fontSize: 12.5, flex: 1, fontWeight: '600' },

  saveButton: {
    backgroundColor: colors.blue,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 6,
  },
  modalTitle: { fontSize: 15.5, fontWeight: '800', color: colors.text },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: { fontSize: 14, color: colors.text },
  modalEmptyText: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingVertical: 20 },
});
