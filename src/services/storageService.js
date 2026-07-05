import { supabase } from "./supabaseClient.js";

export async function uploadAvatar(file, userId) {
  if (!(file instanceof File)) {
    throw new Error("Please choose a valid image file.");
  }

  if (!userId) {
    throw new Error("Missing user ID.");
  }

  const avatarPath = `${userId}/avatar.png`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(avatarPath, file, {
      upsert: true,
      contentType: file.type || "image/png",
      cacheControl: "3600",
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(avatarPath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  return publicUrl;
}

export async function uploadBookCover(file, bookId) {
  if (!(file instanceof File)) {
    throw new Error("Please choose a valid image file.");
  }

  if (!bookId) {
    throw new Error("Missing book ID.");
  }

  const coverPath = `${bookId}/cover.png`;

  const { error: uploadError } = await supabase.storage
    .from("book-covers")
    .upload(coverPath, file, {
      upsert: true,
      contentType: file.type || "image/png",
      cacheControl: "3600",
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("book-covers").getPublicUrl(coverPath);

  const { error: updateError } = await supabase
    .from("books")
    .update({ cover_url: publicUrl })
    .eq("id", bookId);

  if (updateError) {
    throw updateError;
  }

  return publicUrl;
}