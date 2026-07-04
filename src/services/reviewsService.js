import { supabase } from "./supabaseClient.js";

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user?.id) {
    throw new Error("You must be logged in to leave a review.");
  }

  return user.id;
}

export async function addReview(bookId, reviewText, rating) {
  const userId = await requireUserId();

  const normalizedRating = Number(rating);

  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const payload = {
    user_id: userId,
    book_id: bookId,
    review_text: reviewText?.trim() || null,
    rating: normalizedRating,
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(payload)
    .select("id,user_id,book_id,review_text,rating,created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getReviewsByBookId(bookId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id,user_id,book_id,review_text,rating,created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}