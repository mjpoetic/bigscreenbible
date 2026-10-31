import { cleanPlainText } from "./text-cleaner.ts";

type ProviderRequest = (path: string) => Promise<Record<string, unknown>>;

// Search returns USFM references only; text must come from the licensed passage API.
export async function searchYouVersion(
  bibleId: number,
  query: string,
  request: ProviderRequest,
  limit = 20,
) {
  const params = new URLSearchParams({
    bible_id: String(bibleId), query, user_intent: "text", page_size: String(limit),
  });
  const payload = await request(`/v1/search-verses?${params}`);
  const hits = Array.isArray(payload.verses) ? payload.verses : [];
  const references = [...new Set(hits.map((hit) => String(hit?.reference || hit?.id || "")))]
    .filter((ref) => /^[1-3]?[A-Z]{2,3}\.\d+\.\d+(?:-\d+)?$/.test(ref))
    .slice(0, limit);
  const results: Array<{ ref: string; text: string }> = [];
  // Bound passage concurrency to avoid bursting the provider's rate limit.
  for (let start = 0; start < references.length; start += 4) {
    const batch = await Promise.all(references.slice(start, start + 4).map(async (ref) => {
      const passage = await request(`/v1/bibles/${bibleId}/passages/${encodeURIComponent(ref)}?format=text`);
      const text = cleanPlainText(String(passage.content || ""));
      const reference = String(passage.reference || "").trim();
      return text && reference ? { ref: reference, text } : null;
    }));
    results.push(...batch.filter((result): result is { ref: string; text: string } => result !== null));
  }
  return results;
}
