// Which department handles which category. Decided once, used everywhere
// (the backend keeps the same table in constants/departments.js).
export const CATEGORY_DEPARTMENT = {
  Roads: 'Roads & Highways',
  Bridges: 'Roads & Highways',
  Waste: 'Waste Management',
  Water: 'Water Supply',
  Lighting: 'Electricity',
}

// The report categories, in the order the filters list them.
export const CATEGORIES = ['Roads', 'Waste', 'Water', 'Lighting', 'Bridges']

// The departments, for the staff sign-up list.
export const DEPARTMENTS = ['Roads & Highways', 'Waste Management', 'Water Supply', 'Electricity']

// The periods on the Accountability screen. 8 weeks is the default, so the
// screen and Home show the same figures.
export const ACCOUNTABILITY_PERIODS = [
  { weeks: 4, label: 'Last 4 weeks' },
  { weeks: 8, label: 'Last 8 weeks' },
]
export const DEFAULT_PERIOD_WEEKS = 8
