import { supabase } from "./supabaseClient.js";

export async function getAllUsersWithRoles() {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,username")
    .order("id", { ascending: true });

  if (profilesError) {
    throw profilesError;
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id,role");

  if (rolesError) {
    throw rolesError;
  }

  const rolesByUserId = new Map(
    (roles ?? []).map((entry) => [String(entry.user_id), entry.role]),
  );

  return (profiles ?? []).map((entry) => {
    const role = rolesByUserId.get(String(entry.id)) ?? "user";

    return {
      id: entry.id,
      username: entry?.username ?? null,
      role,
    };
  });
}

export async function updateUserRole(userId, role) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!role) {
    throw new Error("Role is required.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("user_roles")
      .update({ role })
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role });

  if (insertError) {
    throw insertError;
  }
}
