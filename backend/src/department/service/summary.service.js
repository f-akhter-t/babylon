import { loadScope, requireDepartment } from './scope.js'

const FIELDS = 'status verification priority'

export async function getSummary(user) {
  const department = requireDepartment(user)
  const [assigned, completed] = await Promise.all([
    loadScope(department, 'assigned', FIELDS),
    loadScope(department, 'completed', FIELDS),
  ])
  return {
    department,
    assigned: assigned.length,
    open: assigned.filter((issue) => issue.status === 'open').length,
    inProgress: assigned.filter((issue) => issue.status === 'in-progress').length,
    awaiting: assigned.filter((issue) => issue.verification === 'awaiting').length,
    completed: completed.length,
  }
}