// F5 weekly summary for one department: the counts are always worked out here;
// the sentence on top comes from Gemini and is simply left out (null) when
// Gemini is not available. A failed AI call never fails the page.
// Only the department name and the counts are sent to the AI.
import { cut, oneLine } from '../../utils/aiText.js'
import { WEEKLY_LIMITS } from '../../constants/limits.js'
import { CATEGORY_DEPARTMENT } from '../../constants/departments.js'
import { isReopened, requireDepartment } from './scope.js'
import { weeklyRequest } from './weekly.prompts.js'

const DAY_MS = 24 * 60 * 60 * 1000

// Loaded when first needed, so a missing file is "no sentence", not a crash.
async function loadGemini() {
  try {
    return await import('../../shared/service/gemini.service.js')
  } catch {
    return null
  }
}

const FIELDS = 'status verification priority createdAt startedAt submittedAt resolvedAt'

async function loadIssues(department) {
  const { default: Issue } = await import('../../models/issue.model.js')
  const categories = Object.entries(CATEGORY_DEPARTMENT)
    .filter(([, name]) => name === department)
    .map(([category]) => category)
  return Issue.find({ category: { $in: categories } }).select(FIELDS).lean()
}

// Pure: the counts for the last `days` days. Reopened issues belong to the
// admin until they decide, so they are left out, as in the list and summary.
export function weekCounts(issues, now = new Date(), days = WEEKLY_LIMITS.days) {
  const since = now.getTime() - days * DAY_MS
  const inWeek = (date) => Boolean(date) && new Date(date).getTime() >= since
  const live = issues.filter((issue) => !isReopened(issue))
  const unresolved = live.filter((issue) => issue.status !== 'resolved')
  const longest = unresolved.reduce((max, issue) => {
    const waited = Math.floor((now.getTime() - new Date(issue.createdAt).getTime()) / DAY_MS)
    return Number.isFinite(waited) ? Math.max(max, waited) : max
  }, 0)
  return {
    newReports: live.filter((issue) => inWeek(issue.createdAt)).length,
    started: live.filter((issue) => inWeek(issue.startedAt)).length,
    submitted: live.filter((issue) => inWeek(issue.submittedAt)).length,
    resolved: live.filter((issue) => inWeek(issue.resolvedAt)).length,
    open: unresolved.filter((issue) => issue.status === 'open').length,
    inProgress: unresolved.filter((issue) => issue.status === 'in-progress' && issue.verification !== 'awaiting').length,
    awaiting: unresolved.filter((issue) => issue.verification === 'awaiting').length,
    longestWaitingDays: Math.max(0, longest),
  }
}

export function createWeeklyService({
  loadDepartmentIssues = loadIssues,
  getGemini = loadGemini,
  now = () => new Date(),
} = {}) {
  // department -> { signature, text, at }. Kept in the server's memory, so on a
  // serverless host each running copy counts for itself.
  const saved = new Map()

  async function sentence(department, counts) {
    const signature = JSON.stringify(counts)
    const t = now().getTime()
    const hit = saved.get(department)
    if (hit && hit.signature === signature && t - hit.at < WEEKLY_LIMITS.cacheMinutes * 60_000) return hit.text
    try {
      const gemini = await getGemini()
      if (typeof gemini?.generateText !== 'function') return null
      const reply = await gemini.generateText(weeklyRequest({ department, counts }))
      const text = cut(oneLine(reply), WEEKLY_LIMITS.summaryMax)
      if (text.length < 10) return null
      saved.set(department, { signature, text, at: t })
      return text
    } catch {
      return null // AI is off or busy: the counts are still shown
    }
  }

  return {
    // user: req.user. -> { department, days, counts, summary }  (summary may be null)
    async getWeekly(user) {
      const department = requireDepartment(user)
      const counts = weekCounts(await loadDepartmentIssues(department), now())
      return { department, days: WEEKLY_LIMITS.days, counts, summary: await sentence(department, counts) }
    },
  }
}

export const { getWeekly } = createWeeklyService()
