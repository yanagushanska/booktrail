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