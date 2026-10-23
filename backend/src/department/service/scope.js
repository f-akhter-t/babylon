import Issue from '../../models/issue.model.js'
import AppError from '../../utils/AppError.js'
import { CATEGORY_DEPARTMENT } from '../../constants/departments.js'
import { MSG } from '../../constants/messages/index.js'

// Reopened issues belong to the admin until they decide. The department skips them.
export const isReopened = (issue) => issue.verification === 'reopened' || issue.priority === 'reopened'

export const departmentOfIssue = (issue) => CATEGORY_DEPARTMENT[issue.category] ?? null

export function requireDepartment(user) {
  if (!user.department) throw new AppError('forbidden', 403, MSG.deptNotYours)
  return user.department
}

function categoriesFor(department) {
  return Object.entries(CATEGORY_DEPARTMENT)
    .filter(([, name]) => name === department)
    .map(([category]) => category)
}

// The one place that decides which issues a department sees.
// The list and the summary both use it, so their counts always match.
// "projection" picks the fields to load (the summary does not need photos).
export async function loadScope(department, scope, projection) {
  const category = { $in: categoriesFor(department) }
  const status = scope === 'completed' ? 'resolved' : { $in: ['open', 'in-progress'] }
  const issues = await Issue.find({ category, status }).select(projection).lean()
  return issues.filter((issue) => !isReopened(issue))
}