import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { GetMessageUseCase } from "@features/chat/application/usecases/GetMessageUseCase";
import { NotifyNewMessageUseCase } from "@features/chat/application/usecases/NotifyNewMessageUseCase";
import { RequestNotificationPermissionUseCase } from "@features/chat/application/usecases/RequestNotificationPermissionUseCase";
import { SendMessageUseCase } from "@features/chat/application/usecases/SendMessageUseCase";
import { SubscribeToRoomUseCase } from "@features/chat/application/usecases/SubscribeToRoomUseCase";
import { UploadImageUseCase } from "@features/chat/application/usecases/UploadImageUseCase";
import { Message } from "@features/chat/domain/entities/Message";
import { ExpoNotificationRepository } from "@features/chat/infrastructure/repositories/ExpoNotificationRepository";
import { SupabaseChatRepository } from "@features/chat/infrastructure/repositories/SupabaseChatRepository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

const chatRepo           = new SupabaseChatRepository();
const notifRepo          = new ExpoNotificationRepository();

const sendMessageUseCase = new SendMessageUseCase(chatRepo);
const getMessagesUseCase = new GetMessageUseCase(chatRepo);
const subscribeUseCase   = new SubscribeToRoomUseCase(chatRepo);
const uploadImageUseCase = new UploadImageUseCase(chatRepo);
const notifyUseCase      = new NotifyNewMessageUseCase(notifRepo);
const requestPermUseCase = new RequestNotificationPermissionUseCase(notifRepo);

export function useChat(roomId: string, roomName: string = 'Sala') {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try { requestPermUseCase.execute(); } catch {}
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: () => getMessagesUseCase.execute(roomId),
    enabled: !!user,
    staleTime: Infinity,
  });

  useEffect(() => {
    const unsubscribe = subscribeUseCase.execute(roomId, (newMsg) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => {
        const exists = old.some((m) => m.id === newMsg.id);
        return exists ? old : [...old, newMsg];
      });

      // Incrementar badge solo si es de otro usuario
      if (newMsg.userId !== user?.id) {
        setUnreadCount((prev) => prev + 1); // ← nuevo
      }

      notifyUseCase.execute(newMsg, user!.id, roomName);
    });
    return unsubscribe;
  }, [roomId, roomName]);

  const clearUnread = () => setUnreadCount(0); // ← nuevo

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      sendMessageUseCase.execute(roomId, user!.id, content),
    onMutate: async (content) => {
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        roomId, userId: user!.id, content,
        createdAt: new Date(), authorUsername: user!.username,
      };
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => [...old, tempMsg]);
      return { tempMsg };
    },
    onSuccess: (realMsg, _content, context) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
        old.map((m) => (m.id === context?.tempMsg.id ? realMsg : m)),
      );
    },
    onError: (_err, _content, context) => {
      if (context?.tempMsg) {
        queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
          old.filter((m) => m.id !== context.tempMsg.id),
        );
      }
    },
  });

  const sendImageMutation = useMutation({
    mutationFn: async (uri: string) => {
      const imageUrl = await uploadImageUseCase.execute(uri, user!.id);
      return sendMessageUseCase.execute(roomId, user!.id, '', imageUrl);
    },
    onMutate: async (uri) => {
      const tempMsg: Message = {
        id: `temp-img-${Date.now()}`,
        roomId, userId: user!.id, content: '',
        imageUrl: uri,
        createdAt: new Date(), authorUsername: user!.username,
      };
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => [...old, tempMsg]);
      return { tempMsg };
    },
    onSuccess: (realMsg, _uri, context) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
        old.map((m) => (m.id === context?.tempMsg.id ? realMsg : m)),
      );
    },
    onError: (_err, _uri, context) => {
      if (context?.tempMsg) {
        queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
          old.filter((m) => m.id !== context.tempMsg.id),
        );
      }
    },
  });

  return {
    messages,
    sendMessage:    sendMutation.mutate,
    sendImage:      sendImageMutation.mutate,
    isLoading,
    isSending:      sendMutation.isPending,
    isUploadingImg: sendImageMutation.isPending,
    unreadCount,   // ← nuevo
    clearUnread,   // ← nuevo
  };
}