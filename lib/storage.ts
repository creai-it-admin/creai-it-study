// 장표 PDF는 브라우저에서 Supabase로 바로 올린다.
// 서버를 거치면 Vercel의 요청 본문 상한(4.5MB)에 걸린다. 1주차 장표가 4.05MB라 아슬아슬하다.
import { createClient } from "@supabase/supabase-js";

export const MAX_DECK_BYTES = 20 * 1024 * 1024; // 서버를 안 거치므로 넉넉히 둔다

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다");
  return createClient(url, key, { auth: { persistSession: false } });
}

function bucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "decks";
}

/** 브라우저가 파일을 바로 던질 수 있는 일회용 주소를 만든다. */
export async function createDeckUploadUrl(sessionId: string) {
  const supabase = client();
  const path = `${sessionId}/${Date.now()}.pdf`;
  const { data, error } = await supabase.storage.from(bucketName()).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { signedUrl: data.signedUrl, path };
}

/** 올라간 파일이 실제로 있는지 확인하고 공개 주소를 돌려준다. */
export async function confirmDeck(path: string) {
  const supabase = client();
  const bucket = bucketName();
  const dir = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop()!;

  const { data, error } = await supabase.storage.from(bucket).list(dir, { search: name });
  if (error) throw new Error(error.message);
  const found = data?.find((f) => f.name === name);
  if (!found) throw new Error("올라간 파일을 찾지 못했습니다");

  const size = (found.metadata as { size?: number } | null)?.size ?? 0;
  if (size > MAX_DECK_BYTES) {
    await supabase.storage.from(bucket).remove([path]);
    throw new Error("20MB를 넘는 파일은 올릴 수 없습니다");
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
