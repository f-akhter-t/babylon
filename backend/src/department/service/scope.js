import AppError from '../../utils/AppError.js'
import { CATEGORY_DEPARTMENT } from '../../constants/departments.js'
import { MSG } from '../../constants/messages/index.js'

// Reopened issues belong to the admin until they decide. Skip them here.
export const NOT_REOPENED = { $nor: [{ verification: 'reopened' }, { priority: 'reopened' }] }

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

export function scopeFilter(department, scope) {
  const category = { $in: categoriesFor(department) }
  if (scope === 'completed') return { category, status: 'resolved', ...NOT_REOPENED }
  return { category, status: { $in: ['open', 'in-progress'] }, ...NOT_REOPENED }
}