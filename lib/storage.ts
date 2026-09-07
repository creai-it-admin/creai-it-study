// 장표 PDF를 Supabase Storage에 올린다.
import { createClient } from "@supabase/supabase-js";

export const MAX_DECK_BYTES = 10 * 1024 * 1024; // FR-202. 10MB를 넘으면 거부한다.

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function uploadDeck(sessionId: string, file: File): Promise<string> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "decks";
  const supabase = client();
  const path = `${sessionId}/${Date.now()}.pdf`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, await file.arrayBuffer(), { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
