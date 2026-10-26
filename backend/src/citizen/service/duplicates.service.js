// F2 duplicate photo check. Takes the report photo and the division, and lists
// unresolved issues in that division whose photo looks alike (CLIP embeddings).
// AI never blocks the core flow: CLIP off or any failure gives an empty list.
// Only the report photo goes to CLIP. imageEmbedding never leaves this file.
import Issue from '../../models/issue.model.js'
import User from '../../models/user.model.js'
import { DUPLICATE_LIMITS } from '../../constants/limits.js'
import { cosineSimilarity } from '../../utils/similarity.js'

async function divisionFor(email) {
  const user = await User.findOne({ email: String(email).trim().toLowerCase() })
    .select('division')
    .lean()
  return user?.division ?? ''
}

async function loadAssess() {
  const { assessPhoto } = await import('../../shared/service/severity.service.js')
  return assessPhoto
}

function findCandidates({ division, category }) {
  return Issue.find({
    division,
    status: { $ne: 'resolved' },
    imageEmbedding: { $exists: true, $ne: [] },
    ...(category ? { category } : {}),
  })
    .select('+imageEmbedding title category status location createdAt')
    .sort({ createdAt: -1 })
    .limit(DUPLICATE_LIMITS.candidateMax)
    .lean()
}

const round = (n) => Math.round(n * 1000) / 1000

function loadPhotos(ids) {
  return Issue.find({ _id: { $in: ids } })
    .select('beforeImg')
    .lean()
}

export function createDuplicatesService({
  assess,
  find = findCandidates,
  divisionOf = divisionFor,
  photosOf = loadPhotos,
} = {}) {
  return {
    // -> { checked: boolean, matches: [...] }
    async check({ email, photoUrl, category }) {
      const division = await divisionOf(email)
      if (!division) return { checked: false, matches: [] } // no division yet: nothing to compare
      let embedding = null
      try {
        const result = await (assess ?? (await loadAssess()))(photoUrl)
        embedding = Array.isArray(result?.embedding) ? result.embedding : null
      } catch {
        embedding = null
      }
      if (!embedding) return { checked: false, matches: [] }

      const candidates = await find({ division, category })
      const matches = []
      for (const issue of candidates) {
        let similarity
        try {
          similarity = cosineSimilarity(embedding, issue.imageEmbedding)
        } catch {
          continue // a stored vector of the wrong length is skipped
        }
        if (similarity >= DUPLICATE_LIMITS.minSimilarity) {
          matches.push({
            id: String(issue._id),
            title: issue.title,
            category: issue.category,
            status: issue.status,
            location: issue.location,
            similarity: round(similarity),
          })
        }
      }
      matches.sort((a, b) => b.similarity - a.similarity)
      const top = matches.slice(0, DUPLICATE_LIMITS.maxMatches)
      const photos = top.length ? await photosOf(top.map((m) => m.id)) : []
      const photoOf = new Map(photos.map((p) => [String(p._id), p.beforeImg]))
      return {
        checked: true,
        matches: top.map((m) => ({ ...m, beforeImg: photoOf.get(m.id) })),
      }
    },
  }
}

export const duplicatesService = createDuplicatesService()
export const check = (input) => duplicatesService.check(input)
