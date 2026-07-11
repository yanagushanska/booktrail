import { supabase } from "./supabaseClient.js";

function getReadableAuthErrorMessage(error, fallbackMessage) {
  const candidates = [
    error?.message,
    error?.error_description,
    error?.details,
    error?.hint,
    error?.msg,
    error?.cause?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const message = candidate.trim();

      if (message && message !== "[]" && message !== "{}") {
        return message;
      }
    }
  }

  if (Array.isArray(error?.errors) && error.errors.length) {
    const messages = error.errors
      .map((entry) => {
        if (typeof entry === "string") {
          return entry.trim();
        }

        return [entry?.message, entry?.details, entry?.hint]
          .filter((value) => typeof value === "string" && value.trim())
          .map((value) => value.trim())
          .join(" ");
      })
      .filter((entry) => entry && entry !== "[]" && entry !== "{}");

    if (messages.length) {
      return messages.join("; ");
    }
  }

  if (typeof error?.code === "string" && error.code.trim()) {
    return `Signup failed (${error.code.trim()}).`;
  }

  if (typeof error?.status === "number") {
    return `Signup failed (${error.status}).`;
  }

  return fallbackMessage;
}

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
  const username = String(email ?? "")
    .trim()
    .split("@")[0]
    .trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    throw new Error(getReadableAuthErrorMessage(error, "Something went wrong, please try again."));
  }

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(getReadableAuthErrorMessage(error, "Something went wrong, please try again."));
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}