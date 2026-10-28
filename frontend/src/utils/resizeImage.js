// Shrinks a photo and returns it as a JPEG data URL.
// Full-size phone photos are too big to send as they are (the server limits the
// size of each request), so photos go up as this smaller copy instead.
export function resizeImage(file, maxSize = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('We could not read that photo. Please try a different one.'))
    }

    img.src = url
  })
}
