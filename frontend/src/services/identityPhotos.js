// NID card photos for identity checks. Only api.js uses this file.
// The photos are kept in their own browser database (IndexedDB), never in
// babylon.profiles, and only while their submission is Pending. A real
// backend would keep them in access-controlled storage with the same
// delete-after-review rule.
//
// One record per submission: { email, submittedAt, savedAt, blob }, keyed by
// [email, submittedAt], so a photo can only ever be shown for its own
// submission, and two submissions never overwrite each other's photo.
// Every failure throws an Error with code 'storage-blocked' or 'storage-full'.

const DB_NAME = 'babylon'
const DB_VERSION = 1
const STORE = 'identityPhotos'

function storeError(cause) {
  const full = cause?.name === 'QuotaExceededError'
  return Object.assign(new Error(full ? 'storage full' : 'storage blocked'), {
    code: full ? 'storage-full' : 'storage-blocked',
  })
}

function openDb() {
  return new Promise((resolve, reject) => {
    let request
    try {
      request = window.indexedDB.open(DB_NAME, DB_VERSION)
    } catch (err) {
      reject(storeError(err)) // no IndexedDB, or site data is blocked
      return
    }
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: ['email', 'submittedAt'] })
      store.createIndex('email', 'email')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(storeError(request.error))
    request.onblocked = () => reject(storeError(null))
  })
}

// Runs work(store, box) in one transaction. Resolves with box.result only once
// the transaction has completed, so a write is really saved.
async function withStore(mode, work) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      let tx
      try {
        tx = db.transaction(STORE, mode)
      } catch (err) {
        reject(storeError(err))
        return
      }
      const box = { result: undefined }
      tx.oncomplete = () => resolve(box.result)
      tx.onerror = () => reject(storeError(tx.error))
      tx.onabort = () => reject(storeError(tx.error))
      work(tx.objectStore(STORE), box)
    })
  } finally {
    db.close()
  }
}

const keyOf = (email, submittedAt) => [email.toLowerCase(), submittedAt]

export function savePhoto(email, submittedAt, blob) {
  return withStore('readwrite', (store) => {
    store.put({ email: email.toLowerCase(), submittedAt, savedAt: Date.now(), blob })
  })
}

// The photo (a Blob) for this exact submission, or null.
export function readPhoto(email, submittedAt) {
  return withStore('readonly', (store, box) => {
    const request = store.get(keyOf(email, submittedAt))
    request.onsuccess = () => {
      box.result = request.result?.blob ?? null
    }
  })
}

export function deletePhoto(email, submittedAt) {
  return withStore('readwrite', (store) => {
    store.delete(keyOf(email, submittedAt))
  })
}

// Deletes this account's photos from earlier submissions (a new one replaces them).
export function deleteOtherPhotos(email, keepSubmittedAt) {
  return withStore('readwrite', (store) => {
    const request = store.index('email').openCursor(IDBKeyRange.only(email.toLowerCase()))
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      if (cursor.value.submittedAt !== keepSubmittedAt) cursor.delete()
      cursor.continue()
    }
  })
}

// Deletes every photo whose submission is no longer Pending; isPending(email,
// submittedAt) decides. Photos younger than minAgeMs are always kept: their
// submission may still be on its way (photo saved, Pending not written yet).
export function deleteStalePhotos(isPending, minAgeMs) {
  return withStore('readwrite', (store) => {
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      const { email, submittedAt, savedAt } = cursor.value
      if (Date.now() - savedAt >= minAgeMs && !isPending(email, submittedAt)) cursor.delete()
      cursor.continue()
    }
  })
}
