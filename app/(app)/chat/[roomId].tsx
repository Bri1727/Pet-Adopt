import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { Message } from '@features/chat/domain/entities/Message';
import { useChat } from '@features/chat/presentation/hooks/useChat';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image,
  KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import LottieView from 'lottie-react-native';

const C = {
  primary: '#b3006a',
  onPrimary: '#ffffff',
  primaryFixed: '#ffd9e4',
  onTertiaryFixed: '#3e0023',
  tertiaryFixed: '#ffd9e4',
  background: '#f9f9ff',
  surface: '#ffffff',
  onSurface: '#151c27',
  onSurfaceVariant: '#5b3f49',
  outlineVariant: '#e3bdc8',
  outline: '#e3bdc8',
};

function LottieAvatar({ size }: { size: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: C.primaryFixed, borderWidth: 1, borderColor: C.outlineVariant,
      overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    }}>
      <LottieView
        source={require('../../../src/assets/lotties/user.json')}
        autoPlay
        loop
        style={{ width: size * 0.7, height: size * 0.7 }}
      />
    </View>
  );
}

export default function ChatScreen() {
  const { roomId, productName } = useLocalSearchParams<{ roomId: string; productName: string }>();
  const { messages, sendMessage, sendImage, isLoading, isUploadingImg, unreadCount, clearUnread } = useChat(roomId);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSendMsg = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, sendMessage]);

  const handlePickImage = useCallback(async () => {
    Alert.alert("Enviar imagen", "Elige una opción", [
      {
        text: "Cámara",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert("Permiso denegado", "Se necesita acceso a la cámara.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sendImage(result.assets[0].uri);
          }
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert("Permiso denegado", "Se necesita acceso a la galería.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sendImage(result.assets[0].uri);
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, [sendImage]);

  const renderMsg = ({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;
    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        {!isOwn && <LottieAvatar size={28} />}
        <View style={[styles.bubble, isOwn ? styles.own : styles.other]}>
          {!isOwn && <Text style={styles.author}>{item.authorUsername}</Text>}
          {item.imageUrl
            ? <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />
            : <Text style={[styles.text, isOwn && styles.textOwn]}>{item.content}</Text>
          }
          <Text style={[styles.time, isOwn && styles.timeOwn]}>
            {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 120}
    >
      <LottieView
        source={require('../../../src/assets/lotties/flower.json')}
        autoPlay
        loop
        style={styles.lottieBg}
      />

      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <LottieAvatar size={36} />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle} numberOfLines={1}>
            {productName ?? 'Chat'}
          </Text>
          <Text style={styles.chatHeaderSub}>
            {user?.role === 'cliente' ? 'Chateando con el refugio' : 'Chateando con el adoptante'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMsg}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyChat}>
              {user?.role === 'cliente'
                ? '¡Hola! Pregunta lo que quieras sobre la mascota 👇'
                : 'Esperando preguntas del adoptante...'}
            </Text>
          }
        />
      )}

      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.unreadBadge}
          onPress={() => { listRef.current?.scrollToEnd({ animated: true }); clearUnread(); }}
        >
          <Text style={styles.unreadText}>
            {unreadCount} mensaje{unreadCount > 1 ? 's' : ''} nuevo{unreadCount > 1 ? 's' : ''} ↓
          </Text>
        </TouchableOpacity>
      )}

      {isUploadingImg && (
        <View style={styles.uploadingBar}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.uploadingText}>Subiendo imagen...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage} disabled={isUploadingImg}>
          <LottieView
            source={require('../../../src/assets/lotties/camera.json')}
            autoPlay
            loop
            style={{ width: 28, height: 28 }}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={user?.role === 'cliente' ? '¿Tienes alguna pregunta?' : 'Responde al adoptante...'}
          placeholderTextColor="rgba(91,63,73,0.5)"
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMsg}>
          <LottieView
            source={require('../../../src/assets/lotties/send.json')}
            autoPlay
            loop
            style={{ width: 24, height: 24 }}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.background },
  lottieBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
    opacity: 0.06, zIndex: 0,
  },
  loaderCenter:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.primary,
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderColor: C.outlineVariant,
    zIndex: 1,
  },
  backBtn:         { marginRight: 2 },
  backText:        { fontSize: 40, color: '#fff', fontWeight: '600' },
  chatHeaderInfo:  { flex: 1 },
  chatHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  chatHeaderSub:   { fontSize: 12, color: '#fff', marginTop: 2 },
  row:             { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  rowOwn:          { justifyContent: 'flex-end' },
  bubble:          { maxWidth: '75%', borderRadius: 16, padding: 10 },
  own:             { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  other: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.outlineVariant,
    borderBottomLeftRadius: 4,
  },
  author:  { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant, marginBottom: 2 },
  text:    { fontSize: 15, color: C.onSurface },
  textOwn: { color: C.onPrimary },
  chatImage:       { width: 200, height: 200, borderRadius: 10 },
  time:            { fontSize: 10, color: '#aaa', marginTop: 4, alignSelf: 'flex-end' },
  timeOwn:         { color: 'rgba(255,255,255,0.6)' },
  listContent:     { padding: 12 },
  emptyChat: {
    textAlign: 'center', color: C.onSurfaceVariant,
    marginTop: 60, fontSize: 14, paddingHorizontal: 32,
  },
  unreadBadge: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    backgroundColor: C.primary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, elevation: 4, zIndex: 2,
  },
  unreadText:  { color: C.onPrimary, fontWeight: '600', fontSize: 13 },
  uploadingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.onSurface, paddingVertical: 6, gap: 8,
  },
  uploadingText: { color: '#fff', fontSize: 13 },
  inputRow: {
    flexDirection: 'row', padding: 20, paddingBottom: 30,
    backgroundColor: C.surface, borderTopWidth: 1, borderColor: C.outlineVariant,
    alignItems: 'flex-end',
  },
  attachBtn:    { paddingBottom: 8, paddingRight: 6 },
  input: {
    flex: 1, borderWidth: 1, borderColor: C.outline,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100,
    color: C.onSurface, backgroundColor: C.background,
  },
  sendBtn: {
    marginLeft: 8, backgroundColor: C.primary, borderRadius: 20,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
});
