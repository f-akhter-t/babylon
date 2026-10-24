// Cosine similarity of two number lists (for example two photo embeddings).
// 1 means the same direction (very alike), 0 means unrelated, -1 means opposite.
// A list of all zeros has no direction, so the answer is 0.
// Pure and synchronous: no database, no network.

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || a.length !== b.length) {
    throw new TypeError('cosineSimilarity needs two lists of the same, non-zero length')
  }
  let dot = 0
  let sumA = 0
  let sumB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    sumA += a[i] * a[i]
    sumB += b[i] * b[i]
  }
  if (sumA === 0 || sumB === 0) return 0
  return dot / (Math.sqrt(sumA) * Math.sqrt(sumB))
}
