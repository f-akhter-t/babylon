// The NID card photo for an identity check: decoded and made smaller before
// it is kept. Large enough for the admin to read the card text, small enough
// to keep. Re-encoding as JPEG also drops the photo's hidden details (EXIF),
// such as where it was taken.

export const ID_PHOTO_MAX_EDGE = 1600
export const ID_PHOTO_MAX_BYTES = 1.5 * 1024 * 1024
const QUALITIES = [0.85, 0.75, 0.65] // lower only when the photo is still too large

export const UNREADABLE_PHOTO =
  'We could not open that photo. It may be in a format this browser cannot read, such as HEIC. Please choose a JPG, PNG or WebP photo.'
export const PHOTO_TOO_LARGE =
  'That photo is still too large after making it smaller. Please take a new photo of just the card, or choose a smaller one.'
export const PHOTO_RESIZE_FAILED =
  'We could not prepare that photo. Please try again, or choose a different photo.'

function photoError(message) {
  return Object.assign(new Error(message), { code: 'photo' })
}

async function decode(file) {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  } catch {
    throw photoError(UNREADABLE_PHOTO)
  } finally {
    URL.revokeObjectURL(url)
  }
  if (!img.naturalWidth || !img.naturalHeight) throw photoError(UNREADABLE_PHOTO)
  return img
}

// true when this browser can open the file as an image (a renamed text file
// or a HEIC photo in some browsers cannot be opened).
export async function canReadImage(file) {
  try {
    await decode(file)
    return true
  } catch {
    return false
  }
}

const toBlob = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))

// Returns a JPEG Blob, at most ID_PHOTO_MAX_EDGE on its longest side (never
// made larger) and at most ID_PHOTO_MAX_BYTES. Throws a whole-sentence message.
export async function prepareIdPhoto(file) {
  const img = await decode(file)
  const scale = Math.min(1, ID_PHOTO_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const context = canvas.getContext('2d')
  if (!context) throw photoError(PHOTO_RESIZE_FAILED)
  context.drawImage(img, 0, 0, canvas.width, canvas.height)

  for (const quality of QUALITIES) {
    const blob = await toBlob(canvas, quality)
    if (!blob) throw photoError(PHOTO_RESIZE_FAILED)
    if (blob.size <= ID_PHOTO_MAX_BYTES) return blob
  }
  throw photoError(PHOTO_TOO_LARGE)
}
