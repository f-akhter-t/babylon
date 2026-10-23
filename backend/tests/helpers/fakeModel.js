// A tiny in-memory stand-in for a Mongoose model, with only the operations the
// admin panel uses. It lets the tests run without a database. The real database
// is covered by the Postman file and by `npm run test:db` (see tests/admin.db.test.js).
import mongoose from 'mongoose'

const get = (doc, path) => path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), doc)

function setPath(doc, path, value) {
  const keys = path.split('.')
  const last = keys.pop()
  let target = doc
  for (const key of keys) target = target[key] ??= {}
  target[last] = value
}

function unsetPath(doc, path) {
  const keys = path.split('.')
  const last = keys.pop()
  let target = doc
  for (const key of keys) target = target?.[key]
  if (target) delete target[last]
}

function matches(doc, filter) {
  return Object.entries(filter).every(([path, want]) => {
    const have = get(doc, path)
    if (want && typeof want === 'object' && !(want instanceof Date) && !mongoose.isValidObjectId(want)) {
      if ('$exists' in want) return (have !== undefined) === want.$exists
      if ('$in' in want) return want.$in.includes(have)
    }
    return String(have) === String(want)
  })
}

class Query {
  constructor(run) {
    this.run = run
    this.sorting = null
  }
  sort(spec) { this.sorting = spec; return this }
  select() { return this }
  lean() { return this }
  distinct(field) {
    return this.then((rows) => [...new Set(rows.map((row) => row[field]))])
  }
  then(resolve, reject) {
    return Promise.resolve()
      .then(() => {
        let rows = this.run()
        if (this.sorting && Array.isArray(rows)) {
          const [[key, dir]] = Object.entries(this.sorting)
          rows = [...rows].sort((a, b) => {
            const x = a[key] ? new Date(a[key]).getTime() : 0
            const y = b[key] ? new Date(b[key]).getTime() : 0
            return (x - y) * dir
          })
        }
        return rows
      })
      .then(resolve, reject)
  }
}

export function fakeModel(initial = []) {
  const rows = initial.map((row) => ({ _id: new mongoose.Types.ObjectId(), ...row }))
  const copy = (row) => (row ? { ...row } : null)
  return {
    rows,
    find: (filter = {}) => new Query(() => rows.filter((r) => matches(r, filter)).map(copy)),
    findById: (id) => new Query(() => copy(rows.find((r) => String(r._id) === String(id)))),
    findOne: (filter) => new Query(() => copy(rows.find((r) => matches(r, filter)))),
    countDocuments: async (filter = {}) => rows.filter((r) => matches(r, filter)).length,
    findOneAndUpdate: (filter, update) =>
      new Query(() => {
        const row = rows.find((r) => matches(r, filter))
        if (!row) return null
        for (const [path, value] of Object.entries(update.$set ?? {})) setPath(row, path, value)
        for (const path of Object.keys(update.$unset ?? {})) unsetPath(row, path)
        for (const [path, value] of Object.entries(update.$push ?? {})) {
          row[path] = [...(row[path] ?? []), value]
        }
        return copy(row)
      }),
  }
}
