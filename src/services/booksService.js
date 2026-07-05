import { supabase } from "./supabaseClient.js";

export async function getAllBooks() {
  const { data, error } = await supabase.from("books").select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getBookById(id) {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createBook({ title, author, genre, description }) {
  const payload = {
    title: title?.trim(),
    author: author?.trim(),
    genre: genre?.trim() || null,
    description: description?.trim() || null,
  };

  if (!payload.title || !payload.author) {
    throw new Error("Title and author are required.");
  }

  const { data, error } = await supabase
    .from("books")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateBook(id, { title, author, genre, description }) {
  const payload = {
    title: title?.trim(),
    author: author?.trim(),
    genre: genre?.trim() || null,
    description: description?.trim() || null,
  };

  if (!id) {
    throw new Error("Book ID is required.");
  }

  if (!payload.title || !payload.author) {
    throw new Error("Title and author are required.");
  }

  const { data, error } = await supabase
    .from("books")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBook(id) {
  if (!id) {
    throw new Error("Book ID is required.");
  }

  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) {
    throw error;
  }
}