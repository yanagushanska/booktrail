import { supabase } from "./supabaseClient.js";

const VALID_STATUSES = new Set(["want_to_read", "reading", "finished"]);

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user?.id) {
    throw new Error("You must be logged in to manage your library.");
  }

  return user.id;
}

export async function getUserBooks(status) {
  const userId = await requireUserId();

  let query = supabase
    .from("user_books")
    .select(
      "id,user_id,book_id,status,rating,started_at,finished_at,created_at,books(id,title,author,genre,description,cover_url,published_year)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status) {
    if (!VALID_STATUSES.has(status)) {
      throw new Error("Invalid library status.");
    }
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function addToLibrary(bookId) {
  const userId = await requireUserId();

  const payload = {
    user_id: userId,
    book_id: bookId,
    status: "want_to_read",
  };

  const { data, error } = await supabase
    .from("user_books")
    .insert(payload)
    .select("id,user_id,book_id,status,rating,started_at,finished_at,created_at")
    .single();

  if (!error) {
    return data;
  }

  if (error.code === "23505") {
    const { data: existingData, error: existingError } = await supabase
      .from("user_books")
      .select("id,user_id,book_id,status,rating,started_at,finished_at,created_at")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .single();

    if (existingError) {
      throw existingError;
    }

    return existingData;
  }

  throw error;
}

export async function getUserBookForBook(bookId) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("user_books")
    .select("id,user_id,book_id,status,rating,started_at,finished_at,created_at")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function markAsFinished(userId, bookId) {
  if (!userId) {
    throw new Error("Missing user ID.");
  }

  if (!bookId) {
    throw new Error("Missing book ID.");
  }

  const finishedAt = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("user_books")
    .upsert(
      {
        user_id: userId,
        book_id: bookId,
        status: "finished",
        finished_at: finishedAt,
      },
      { onConflict: "user_id,book_id" },
    )
    .select("id,user_id,book_id,status,rating,started_at,finished_at,created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateStatus(userBookId, status) {
  if (!VALID_STATUSES.has(status)) {
    throw new Error("Invalid library status.");
  }

  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("user_books")
    .update({ status })
    .eq("id", userBookId)
    .eq("user_id", userId)
    .select("id,user_id,book_id,status,rating,started_at,finished_at,created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}