// F1 hook for createReport. One call, one answer, never throws:
//   photoFields(photoUrl) -> { priority, severityScore?, imageEmbedding? }
// With CLIP off, or any failure, the answer is just { priority: 'medium' } and the
// report is still created (AI never blocks the core flow).
// createReport spreads the answer into the new issue: Issue.create({ ..., ...ai }).
const AI_PRIORITIES = ['medium', 'high', 'urgent']

async function loadAssess() {
  const { assessPhoto } = await import('../../shared/service/severity.service.js')
  return assessPhoto
}

export async function photoFields(photoUrl, { assess } = {}) {
  let result = null
  try {
    result = await (assess ?? (await loadAssess()))(photoUrl)
  } catch {
    result = null
  }
  if (!result || !AI_PRIORITIES.includes(result.priority)) return { priority: 'medium' }

  const fields = { priority: result.priority }
  if (Number.isFinite(result.severityScore)) fields.severityScore = result.severityScore
  if (Array.isArray(result.embedding) && result.embedding.every(Number.isFinite)) {
    fields.imageEmbedding = result.embedding
  }
  return fields
}
