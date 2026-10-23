import Issue from '../../models/issue.model.js'
import { requireDepartment, scopeFilter } from './scope.js'

// Uses the same filters as the list, so the counts always equal the list lengths.
export async function getSummary(user) {
  const department = requireDepartment(user)
  const assigned = scopeFilter(department, 'assigned')
  const [open, inProgress, awaiting, completed] = await Promise.all([
    Issue.countDocuments({ ...assigned, status: 'open' }),
    Issue.countDocuments({ ...assigned, status: 'in-progress' }),
    Issue.countDocuments({ ...assigned, status: 'in-progress', verification: 'awaiting' }),
    Issue.countDocuments(scopeFilter(department, 'completed')),
  ])
  return { department, assigned: open + inProgress, open, inProgress, awaiting, completed }
}