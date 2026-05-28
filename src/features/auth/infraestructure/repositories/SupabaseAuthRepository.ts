// src/features/auth/infraestructure/repositories/SupabaseAuthRepository.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../../../shared/infrastructure/supabase/client';
import { User, UserRole } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';


export class SupabaseAuthRepository implements IAuthRepository {

  // ── métodos existentes sin cambio ──────────────────────────────────────────

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw error;
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, role')
      .eq('id', data.user.id)
      .single();
    return {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username ?? '',
      avatarUrl: profile?.avatar_url ?? undefined,
      role: profile?.role ?? 'cliente',
    };
  }

  async register(email: string, password: string, username: string, role: UserRole): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, role } },
    });
    if (error) throw error;
    const user = data.user ?? data.session?.user;
    if (!user) throw new Error('Revisa tu correo para confirmar tu cuenta');
    return { id: user.id, email: user.email!, username, role };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, role')
      .eq('id', user.id)
      .single();
    return {
      id: user.id,
      email: user.email!,
      username: profile?.username ?? '',
      avatarUrl: profile?.avatar_url ?? undefined,
      role: profile?.role ?? 'cliente',
    };
  }

  // ── Google Sign-In ──────────────────────────────────────────────────────────

  async signInWithGoogle(): Promise<User> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'michatapp' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data?.url) throw new Error(error?.message ?? 'No se obtuvo la URL de Google');

  // ← usar WebBrowser, NO AuthSession
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== 'success' || !result.url) {
    throw new Error('Login con Google cancelado');
  }

  // Extraer tokens del hash de la URL de callback
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.replace('#', ''));
  const accessToken  = params.get('access_token');
  const refreshToken = params.get('refresh_token') ?? '';

  if (!accessToken) throw new Error('No se recibió el token de Google');

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError || !sessionData.user) throw sessionError;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, role')
    .eq('id', sessionData.user.id)
    .single();

  return {
    id: sessionData.user.id,
    email: sessionData.user.email!,
    username: profile?.username
      ?? sessionData.user.user_metadata?.full_name
      ?? sessionData.user.email!.split('@')[0],
    avatarUrl: profile?.avatar_url
      ?? sessionData.user.user_metadata?.avatar_url
      ?? undefined,
    role: profile?.role ?? 'cliente',
  };
}
}