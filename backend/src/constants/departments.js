// Which department handles which category. Decided once, used everywhere
// (copied from frontend/src/mock/departments.js). Every category has a
// department.
export const CATEGORY_DEPARTMENT = Object.freeze({
  Roads: 'Roads & Highways',
  Bridges: 'Roads & Highways',
  Waste: 'Waste Management',
  Water: 'Water Supply',
  Lighting: 'Electricity',
})

export const DEPARTMENTS = Object.freeze([
  'Roads & Highways',
  'Waste Management',
  'Water Supply',
  'Electricity',
])

export const departmentForCategory = (category) => CATEGORY_DEPARTMENT[category] ?? null

// The periods on the Accountability screen. 8 weeks is the default, so the
// screen and Home show the same figures.
export const ACCOUNTABILITY_PERIODS = Object.freeze([
  { weeks: 4, label: 'Last 4 weeks' },
  { weeks: 8, label: 'Last 8 weeks' },
])
export const DEFAULT_PERIOD_WEEKS = 8
