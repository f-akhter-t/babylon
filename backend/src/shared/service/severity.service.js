// F1: how serious is the problem in a report photo?
// Used by Joyti (when a report is filed) and Riktika (the duplicate check).
//
// CONTRACT (fixed, others code against it):
//   assessPhoto(dataUrl) -> Promise<{ priority, severityScore, embedding } | null>
//     dataUrl        the report photo as a data URL ('data:image/...;base64,...')
//     priority       'medium' | 'high' | 'urgent'
//     severityScore  a number from 0 to 1 (higher means more serious)
//     embedding      the photo as a list of numbers (for the duplicate check)
//   It returns null when the check is off (CLIP_ENABLED is not 'true') or fails.
//   Callers then keep priority 'medium' and still create the report: AI never
//   blocks the core flow. It never throws.
//
// How it decides: the photo and three sentences (medium, high, urgent; see
// CLIP_LIMITS.levels) are turned into embeddings by CLIP. The closer the photo
// is to a sentence, the more weight that level gets. The best level is the
// priority, and severityScore is the weighted average of the levels' weights.
import { clip as defaultClip } from './clip.service.js'
import { CLIP_LIMITS } from '../../constants/limits.js'
import { cosineSimilarity } from '../../utils/similarity.js'

// CLIP compares with a "temperature": similarities are multiplied by about 100
// before the softmax, as in the original model.
const LOGIT_SCALE = 100

function softmax(values) {
  const top = Math.max(...values)
  const exps = values.map((v) => Math.exp(v - top))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

// The highest level whose minScore the score reaches.
export function priorityForScore(score, levels = CLIP_LIMITS.levels) {
  return (levels.filter((l) => score >= l.minScore).at(-1) ?? levels[0]).priority
}

// Pure: from the photo's embedding and the sentences' embeddings to the answer.
export function scoreLevels(imageEmbedding, textEmbeddings, levels = CLIP_LIMITS.levels) {
  const odds = softmax(textEmbeddings.map((text) => LOGIT_SCALE * cosineSimilarity(imageEmbedding, text)))
  const severityScore = odds.reduce((sum, p, i) => sum + p * levels[i].weight, 0)
  return {
    priority: priorityForScore(severityScore, levels),
    severityScore: Math.round(severityScore * 1000) / 1000,
  }
}

export function createSeverityService({ clip = defaultClip, timeoutMs = CLIP_LIMITS.timeoutMs } = {}) {
  let sentenceEmbeddings = null // the three sentences never change, so embed them once

  async function assess(dataUrl) {
    const embedding = await clip.embedImage(dataUrl)
    sentenceEmbeddings ??= await clip.embedTexts(CLIP_LIMITS.levels.map((level) => level.text))
    return { ...scoreLevels(embedding, sentenceEmbeddings), embedding }
  }

  async function assessPhoto(dataUrl) {
    if (!clip.isEnabled()) return null
    let timer
    try {
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('CLIP took too long')), timeoutMs)
      })
      return await Promise.race([assess(dataUrl), timeout])
    } catch (err) {
      console.error('Photo assessment skipped:', err.message)
      sentenceEmbeddings = null
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  return { assessPhoto }
}

export const { assessPhoto } = createSeverityService()
