import { supabase } from "./supabaseClient.js";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function getCurrentUserRole() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return { userId: null, role: null };
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    userId: user.id,
    role: data?.role ?? null,
  };
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}