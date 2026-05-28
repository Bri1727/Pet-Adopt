import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { useMascotas } from '@features/mascotas/presentation/hooks/useMascotas';
import { Mascotas } from '@features/mascotas/domain/entities/Mascotas';
import { useRouter } from 'expo-router';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { mascotas, isLoading, error } = useMascotas();
  const router = useRouter();

  const handleMascotaPress = (mascota: Mascotas) => {
    router.push({
      pathname: '/(app)/mascota/[id]',
      params: {
        id: mascota.id, name: mascota.name,
        especie: mascota.especie, edad: String(mascota.edad),
        tamaño: mascota.tamaño, descripcion: mascota.descripcion,
        raza: mascota.raza,
        imageUrl: mascota.imageUrl ?? '', sellerId: mascota.sellerId,
        sellerName: mascota.sellerName ?? '',
      },
    });
  };

  const renderMascota = ({ item }: { item: Mascotas }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleMascotaPress(item)}>
      {item.imageUrl
        ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardEmoji}>🐾</Text>
          </View>
        )}
      <View style={styles.cardBody}>
        <Text style={styles.cardCategory}>{item.especie}</Text>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
        <View style={styles.cardTags}>
          <Text style={styles.cardTag}>{item.edad} años</Text>
          <Text style={styles.cardTag}>{item.tamaño}</Text>
          <Text style={styles.cardTag}>{item.raza}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredMascotas = user?.role === 'refugio'
    ? mascotas.filter(m => m.sellerId === user.id)
    : mascotas;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Mascotas</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Error al cargar: {error.message}</Text>
        </View>
      )}

      {isLoading
        ? <ActivityIndicator size="large" color="#b3006a" style={{ marginTop: 80 }} />
        : (
          <FlatList<Mascotas>
            data={filteredMascotas}
            keyExtractor={(m) => m.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderMascota}
            ListHeaderComponent={() => (
              <View>
                <View style={styles.heroSection}>
                  <View style={styles.catalogBadge}>
                    <Text style={styles.catalogBadgeText}>
                      {user?.role === 'refugio' ? 'MIS MASCOTAS' : 'MASCOTAS EN ADOPCIÓN'}
                    </Text>
                  </View>
                  <Text style={styles.heroTitle}>Encuentra tu compañero</Text>
                  <Text style={styles.heroSub}>
                    Hola, {user?.username} 👋 — estos peludos te esperan
                  </Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {user?.role === 'refugio' ? '🏡 Refugio' : '🐾 Cliente'}
                    </Text>
                  </View>
                </View>
                {user?.role === 'refugio' && (
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => router.push({ pathname: '/(app)/create-mascota' })}
                  >
                    <Text style={styles.createBtnText}>+ Nueva mascota</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.promoBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promoTitle}>¿Quieres adoptar?</Text>
                    <Text style={styles.promoSub}>Conoce a nuestros animales</Text>
                    <TouchableOpacity
                      style={styles.promoBtn}
                      onPress={() => router.push({ pathname: '/(app)/general-chat' })}
                    >
                      <Text style={styles.promoBtnText}>Contactar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 42 }}>🐶</Text>
                </View>
                <Text style={styles.sectionTitle}>
                  {user?.role === 'refugio' ? 'Mis mascotas' : 'Mascotas disponibles'}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {user?.role === 'refugio'
                  ? 'No tienes mascotas registradas'
                  : 'No hay mascotas disponibles'}
              </Text>
            }
          />
        )
      }

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/(app)/general-chat' })}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f9f9ff' },
  listContent:      { paddingBottom: 100 },
  columnWrapper:    { paddingHorizontal: 16, gap: 12 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#f0e4ea',
  },
  headerBrand:      { fontSize: 18, fontWeight: '700', color: '#b3006a' },
  logoutBtn: {
    borderWidth: 1, borderColor: '#e3bdc8',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  logoutText:       { color: '#b3006a', fontWeight: '600', fontSize: 13 },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20,
  },
  catalogBadge: {
    backgroundColor: '#ffd9e4', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12,
  },
  catalogBadgeText: { fontSize: 12, fontWeight: '700', color: '#b3006a', letterSpacing: 0.8 },
  heroTitle: {
    fontSize: 28, fontWeight: '800', color: '#151c27',
    textAlign: 'center', letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14, color: '#5f5e5e',
    textAlign: 'center', marginTop: 8, lineHeight: 20,
  },
  roleBadge: {
    marginTop: 12, backgroundColor: '#fff0f6',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#e3bdc8',
  },
  roleBadgeText:    { fontSize: 12, color: '#b3006a', fontWeight: '600' },
  createBtn: {
    backgroundColor: '#b3006a',
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  createBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  promoBanner: {
    backgroundColor: '#e00086',
    marginHorizontal: 16, marginBottom: 20,
    borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  promoTitle:       { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 4 },
  promoSub:         { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  promoBtn: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7, alignSelf: 'flex-start',
  },
  promoBtnText:     { color: '#b3006a', fontWeight: '700', fontSize: 13 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#151c27',
    paddingHorizontal: 16, marginBottom: 12,
  },
  card: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 14, overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1, borderColor: '#f0e4ea',
  },
  cardImage:            { width: '100%', height: 140, resizeMode: 'cover' },
  cardImagePlaceholder: {
    width: '100%', height: 140,
    backgroundColor: '#fff0f6',
    justifyContent: 'center', alignItems: 'center',
  },
  cardEmoji:        { fontSize: 36 },
  cardBody:         { padding: 10 },
  cardCategory: {
    fontSize: 10, fontWeight: '700', color: '#b3006a',
    letterSpacing: 0.8, marginBottom: 2,
  },
  cardName:         { fontSize: 13, fontWeight: '700', color: '#151c27', marginBottom: 4 },
  cardDesc:         { fontSize: 11, color: '#8f6e79', marginBottom: 6 },
  cardTags:         { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  cardTag: {
    fontSize: 10, color: '#b3006a', backgroundColor: '#fff0f6',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  empty:            { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },
  errorBanner: {
    backgroundColor: '#ffdad6', padding: 12, marginHorizontal: 16, borderRadius: 8, marginTop: 8,
  },
  errorBannerText:  { color: '#93000a', fontSize: 13, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    backgroundColor: '#b3006a', width: 52, height: 52,
    borderRadius: 26, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#b3006a',
    shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon:          { fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 32 },
});
