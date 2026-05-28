import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { DeleteMascotasUseCase } from '@features/mascotas/aplication/usecases/DeleteMascotasUseCase';
import { SupabaseMascotasRepository } from '@features/mascotas/infrastructure/repositories/SupabaseMacotasRepository';
import { GetOrCreateSellerRoomUseCase } from '@features/chat/application/usecases/GetOrCreateSellerRoomUseCase';
import { SupabaseChatRepository } from '@features/chat/infrastructure/repositories/SupabaseChatRepository';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';

const COLORS = {
  primary: "#b3006a",
  onPrimary: "#ffffff",
  primaryFixed: "#ffd9e4",
  secondary: "#5f5e5e",
  background: "#f9f9ff",
  surface: "#f9f9ff",
  onSurface: "#151c27",
  outlineVariant: "#e3bdc8",
  surfaceContainerLow: "#f0f3ff",
  surfaceContainerHigh: "#e2e8f8",
  surfaceContainerLowest: "#ffffff",
  onSurfaceVariant: "#5b3f49"
};

const chatRepo = new SupabaseChatRepository();
const getOrCreateSellerRoom = new GetOrCreateSellerRoomUseCase(chatRepo);
const mascotasRepo = new SupabaseMascotasRepository();
const deleteMascota = new DeleteMascotasUseCase(mascotasRepo);

export default function MascotaDetailScreen() {
  const { id, name, especie, edad, tamaño, descripcion, raza, imageUrl, sellerId, sellerName } =
    useLocalSearchParams<{
      id: string; name: string; especie: string; edad: string; tamaño: string;
      descripcion: string; raza: string;
      imageUrl?: string; sellerId: string; sellerName?: string;
    }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert('Eliminar mascota', `¿Estás seguro de eliminar a "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteMascota.execute(id);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleChat = async () => {
    if (!user || !sellerId) return;
    setLoading(true);
    try {
      const room = await getOrCreateSellerRoom.execute(sellerId);
      router.push({
        pathname: '/(app)/chat/[roomId]',
        params: { roomId: room.id, productName: name },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mascota</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrapper}>
          <View style={styles.imageContainer}>
            {imageUrl
              ? <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              : <View style={styles.imagePlaceholder}><Text style={styles.placeholderEmoji}>🐾</Text></View>
            }
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.titleInfo}>
              <Text style={styles.badgePrenda}>{especie}</Text>
              <Text style={styles.name}>{name}</Text>
            </View>
          </View>

          <View style={styles.stitchLine} />

          {sellerName && (
            <View style={styles.glassCard}>
              <Text style={styles.cardTitle}>🏡 Refugio</Text>
              <Text style={styles.sellerText}>Publicado por: {sellerName}</Text>
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{edad} años</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tamaño</Text>
              <Text style={styles.infoValue}>{tamaño}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Raza</Text>
              <Text style={styles.infoValue}>{raza}</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.desc}>{descripcion}</Text>
          </View>

          {user?.role === 'cliente' && (
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat} disabled={loading} activeOpacity={0.9}>
              {loading
                ? <ActivityIndicator color={COLORS.onPrimary} />
                : <Text style={styles.chatBtnText}>💬 Preguntar al refugio</Text>}
            </TouchableOpacity>
          )}

          {user?.id === sellerId && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting} activeOpacity={0.9}>
              {deleting
                ? <ActivityIndicator color={COLORS.onPrimary} />
                : <Text style={styles.deleteBtnText}>✕ Eliminar mascota</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: Platform.OS === 'ios' ? 96 : 64,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroWrapper: {
    position: 'relative',
  },
  imageContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  titleInfo: {
    flex: 1,
  },
  badgePrenda: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  stitchLine: {
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderStyle: 'dashed',
    marginVertical: 24,
    opacity: 0.4,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(227, 189, 200, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sellerText: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    backgroundColor: COLORS.primaryFixed,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    lineHeight: 24,
  },
  chatBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chatBtnText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  deleteBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});
