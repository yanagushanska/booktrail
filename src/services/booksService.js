import { supabase } from "./supabaseClient.js";

export async function getAllBooks() {
  const { data, error } = await supabase.from("books").select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}