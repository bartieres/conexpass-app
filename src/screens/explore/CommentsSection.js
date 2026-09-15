import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../theme/theme';

function getInitials(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function CommentItem({ comentario }) {
  return (
    <View style={styles.commentItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getInitials(comentario.autorNome)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentHeaderRow}>
          <Text style={styles.commentAuthor}>{comentario.autorNome}</Text>
          <Text style={styles.commentDate}>{comentario.dataFormatada}</Text>
        </View>
        <Text style={styles.commentText}>{comentario.texto}</Text>
      </View>
    </View>
  );
}

export default function CommentsSection({
  comentarios,
  loading,
  error,
  onRetry,
  onSubmit,
  sending,
}) {
  const [texto, setTexto] = useState('');

  const handleEnviar = () => {
    if (!texto.trim()) return;
    onSubmit(texto.trim());
    setTexto('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Comentários</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Deixe um comentário sobre esse estabelecimento..."
          placeholderTextColor={colors.textLight}
          value={texto}
          onChangeText={setTexto}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!texto.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleEnviar}
          disabled={!texto.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color={colors.blue} />
        </View>
      )}

      {!loading && !!error && (
        <View style={styles.stateBox}>
          <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity onPress={onRetry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && comentarios.length === 0 && (
        <Text style={styles.emptyText}>
          Seja o primeiro a comentar sobre esse estabelecimento.
        </Text>
      )}

      {!loading &&
        !error &&
        comentarios.map((comentario) => (
          <CommentItem key={comentario.id} comentario={comentario} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },
  sectionTitle: { ...typography.h3, marginBottom: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text,
    maxHeight: 90,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  stateBox: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  stateText: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: 12.5, color: colors.blue, fontWeight: '700' },
  emptyText: {
    fontSize: 12.5,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 12,
  },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '800', color: colors.blue },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: colors.text },
  commentDate: { fontSize: 11, color: colors.textLight },
  commentText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 18,
  },
});
