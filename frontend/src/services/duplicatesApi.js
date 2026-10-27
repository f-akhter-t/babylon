// F2: similar photos in the citizen's division, before a report is filed.
// The server takes the division from the account. When CLIP is off or fails
// it answers { checked: false, matches: [] }, never an error.
import { post } from './http.js'

export async function checkDuplicates(photoUrl) {
  const data = await post('/citizen/reports/duplicates', { photoUrl })
  return {
    checked: Boolean(data?.checked),
    matches: Array.isArray(data?.matches) ? data.matches : [],
  }
}