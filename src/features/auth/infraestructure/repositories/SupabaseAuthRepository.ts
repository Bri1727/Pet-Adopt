import { supabase } from "../../../../shared/infrastructure/supabase/client"
import { User, UserRole } from "../../domain/entities/User"
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";

export class SupabaseAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) throw error;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, role")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username ?? "",
      avatarUrl: profile?.avatar_url ?? undefined,
      role: profile?.role ?? "cliente",
    };
  }

async register(email: string, password: string, username: string, role: UserRole): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, role },
    },
  });

  if (error) throw error;

  const user = data.user ?? data.session?.user;
  if (!user) throw new Error("Revisa tu correo para confirmar tu cuenta");

  return { 
    id: user.id, 
    email: user.email!, 
    username,
    role,
  };
}

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, role")
      .eq("id", user.id)
      .single();
    return {
      id: user.id,
      email: user.email!,
      username: profile?.username ?? "",
      avatarUrl: profile?.avatar_url ?? undefined,
      role: profile?.role ?? "cliente",
    };
  }
}
