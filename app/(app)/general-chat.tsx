import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { Room } from "@features/chat/domain/entities/Message";
import { SupabaseChatRepository } from "@features/chat/infrastructure/repositories/SupabaseChatRepository";
import { supabase } from "@shared/infrastructure/supabase/client";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  primary: "#b3006a",
  onPrimary: "#ffffff",
  primaryFixed: "#ffd9e4",
  onTertiaryFixed: "#3e0023",
  tertiaryFixed: "#ffd9e4",
  background: "#f9f9ff",
  surface: "#ffffff",
  onSurface: "#151c27",
  onSurfaceVariant: "#5b3f49",
  outlineVariant: "#e3bdc8",
};
type SellerRoom = Room;

const chatRepo = new SupabaseChatRepository();

function LottieAvatar({ size }: { size: number }) {
  return (
    <View
      style={[
        styles.avatarWrapper,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <LottieView
        source={require("../../src/assets/lotties/user.json")}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default function GeneralChatScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [myRooms, setMyRooms] = useState<SellerRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (user.role === "refugio") {
          setIsLoading(true);
          const rooms = await chatRepo.getRooms();
          const sellerRooms = rooms.filter((r) => r.sellerId === user.id);
          const clientIds = [
            ...new Set(sellerRooms.map((r) => r.clientId).filter(Boolean)),
          ];
          if (clientIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, username")
              .in("id", clientIds);
            const profileMap = new Map(
              (profiles ?? []).map((p) => [p.id, p.username]),
            );
            setMyRooms(
              sellerRooms.map((r) => ({
                ...r,
                clientUsername: profileMap.get(r.clientId),
              })),
            );
          } else {
            setMyRooms(sellerRooms);
          }
        } else {
          router.replace("/(app)/sellers");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text
          style={{
            color: "#FF3B30",
            fontSize: 14,
            textAlign: "center",
            paddingHorizontal: 32,
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  const renderRoom = ({ item }: { item: SellerRoom }) => (
    <TouchableOpacity
      style={styles.roomCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/(app)/chat/[roomId]",
          params: { roomId: item.id, productName: item.mascotaName ?? "Chat" },
        })
      }
    >
      <View style={styles.cardIndicator} />
      <View style={styles.roomContent}>
        <LottieAvatar size={52} />
        <View style={styles.roomInfo}>
          <View style={styles.nameHeader}>
            <Text style={styles.clientName}>
              {item.clientUsername || "Adoptante"}
            </Text>
            <Text style={styles.timeTag}>Ahora</Text>
          </View>
          {item.mascotaName ? (
            <View style={styles.badgeRow}>
              <View style={styles.productBadge}>
                <Text style={styles.productBadgeText}>{item.mascotaName}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.lastMessagePlaceholder}>
              Toca para abrir la conversación
            </Text>
          )}
        </View>
      </View>
      <View style={styles.stitchBorder} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <LottieView
          source={require("../../src/assets/lotties/flower.json")}
          autoPlay
          loop
          style={styles.lottieBackground}
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mascotas</Text>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Mis chats con adoptantes</Text>
        </View>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={myRooms}
            keyExtractor={(r) => r.id}
            renderItem={renderRoom}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <LottieAvatar size={100} />
                <Text style={[styles.emptyText, { marginTop: 16 }]}>
                  No tienes chats activos aún
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  lottieBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.07,
    zIndex: 0,
  },
  header: {
    height: 60,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  roomCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    zIndex: 1,
  },
  cardIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
  },
  roomContent: { flexDirection: "row", alignItems: "center", padding: 16 },
  avatarWrapper: {
    backgroundColor: COLORS.primaryFixed,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  roomInfo: { flex: 1, marginLeft: 14 },
  nameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  clientName: { fontSize: 16, fontWeight: "600", color: COLORS.onSurface },
  timeTag: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  badgeRow: { flexDirection: "row", marginTop: 4 },
  productBadge: {
    backgroundColor: COLORS.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productBadgeText: {
    fontSize: 11,
    color: COLORS.onTertiaryFixed,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  lastMessagePlaceholder: { fontSize: 14, color: COLORS.onSurfaceVariant },
  stitchBorder: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderStyle: "dashed",
  },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    textAlign: "center",
    color: COLORS.onSurfaceVariant,
    fontSize: 15,
    fontWeight: "500",
  },
  chatArrow: { fontSize: 20, color: COLORS.primary, marginLeft: 8 },
});
