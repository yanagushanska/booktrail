import { supabase } from "../services/supabaseClient.js";

export async function requireAuth() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user?.id) {
    window.location.href = "/pages/login.html";
    return null;
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (!session?.user?.id) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || data?.role !== "admin") {
    window.location.href = "/index.html";
    return false;
  }

  return true;
}
