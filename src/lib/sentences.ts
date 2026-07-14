/** Split paragraph text into sentence-like units for text highlight. */
export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/(?<=[.!?。！？…]["'"」』]?\s+)|(?<=[.!?。！？…])(?=["'"」』]?\s)/);
  const out = parts.map((s) => s.trim()).filter(Boolean);
  return out.length ? out : [cleaned];
}
