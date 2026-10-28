// CLIP: turns a photo into numbers (an "embedding") and compares it with
// sentences, so a photo can be judged without training anything.
// Runs inside Node with transformers.js, behind CLIP_ENABLED. The model is
// downloaded and loaded ONCE, on first use, and reused after that.
//
// Everything here can fail (no network, not enough memory, bad photo). Callers
// treat any failure as "AI skipped": these functions reject, and
// severity.service turns that into null so a report is never blocked.
import { env } from '../../config/env.js'
import { CLIP_LIMITS } from '../../constants/limits.js'

// loadTransformers is injectable so the tests never download a model.
export function createClipService({
  enabled = () => env.clipEnabled,
  loadTransformers = () => import('@huggingface/transformers'),
  modelId = CLIP_LIMITS.model,
  dtype = CLIP_LIMITS.dtype,
} = {}) {
  let loading = null

  // The pieces are loaded together, once. A failed load is forgotten, so the
  // next photo tries again.
  function load() {
    loading ??= (async () => {
      const t = await loadTransformers()
      const [processor, vision, tokenizer, text] = await Promise.all([
        t.AutoProcessor.from_pretrained(modelId),
        t.CLIPVisionModelWithProjection.from_pretrained(modelId, { dtype }),
        t.AutoTokenizer.from_pretrained(modelId),
        t.CLIPTextModelWithProjection.from_pretrained(modelId, { dtype }),
      ])
      return { t, processor, vision, tokenizer, text }
    })().catch((err) => {
      loading = null
      throw err
    })
    return loading
  }

  const normalize = (values) => {
    const list = Array.from(values)
    const length = Math.sqrt(list.reduce((sum, x) => sum + x * x, 0)) || 1
    return list.map((x) => x / length)
  }

  // dataUrl: 'data:image/...;base64,...'. Returns a list of numbers, length 1.
  async function embedImage(dataUrl) {
    const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(String(dataUrl))
    if (!match) throw new TypeError('Not an image data URL')
    const { t, processor, vision } = await load()
    const blob = new Blob([Buffer.from(match[2], 'base64')], { type: match[1] })
    const image = await t.RawImage.fromBlob(blob)
    const { image_embeds } = await vision(await processor(image))
    return normalize(image_embeds.data)
  }

  // texts: a list of sentences. Returns one embedding (length 1) for each.
  async function embedTexts(texts) {
    const { tokenizer, text } = await load()
    const inputs = tokenizer(texts, { padding: true, truncation: true })
    const { text_embeds } = await text(inputs)
    const size = text_embeds.dims.at(-1)
    return texts.map((_, i) => normalize(text_embeds.data.slice(i * size, (i + 1) * size)))
  }

  return { isEnabled: () => Boolean(enabled()), embedImage, embedTexts }
}

export const clip = createClipService()
