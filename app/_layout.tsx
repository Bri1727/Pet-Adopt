import { SupabaseAuthRepository } from '@features/auth/infraestructure/repositories/SupabaseAuthRepository';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { supabase } from '@shared/infrastructure/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});
const authRepo = new SupabaseAuthRepository();

function AuthGuard() {
  const { user, setUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  // 1. Añadimos un estado para saber cuándo terminó la carga inicial de Supabase
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Restaurar sesión al iniciar la app
    authRepo.getCurrentUser()
      .then(setUser)
      .finally(() => setIsAuthReady(true)); // Marcamos como listo tras el intento inicial

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const user = await authRepo.getCurrentUser();
          setUser(user);
        } else {
          setUser(null);
        }
        setIsAuthReady(true);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // 2. Si Supabase no ha respondido la sesión inicial, no hacemos nada todavía
    if (!isAuthReady) return;

    // 3. Usamos un micro-delay (setImmediate o setTimeout 0) para asegurarnos 
    // de que el hilo de renderizado de Expo Router ya montó el Slot raíz.
    const navigationTimeout = setTimeout(() => {
      const inAuth = segments[0] === '(auth)';

      if (!user && !inAuth) {
        router.replace('/(auth)/login');
      } else if (user && inAuth) {
        router.replace('/(app)');
      }
    }, 0);

    return () => clearTimeout(navigationTimeout);
  }, [user, segments, isAuthReady]); // Añadimos isAuthReady a las dependencias

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
    </QueryClientProvider>
  );
}