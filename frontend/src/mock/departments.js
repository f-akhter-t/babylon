// Which department handles which category. Decided once, used everywhere.
export const CATEGORY_DEPARTMENT = {
  Roads: 'Roads & Highways',
  Bridges: 'Roads & Highways',
  Waste: 'Waste Management',
  Water: 'Water Supply',
  Lighting: 'Electricity',
}

// Sample numbers from the Figma (Accountability screen).
// Totals: 228 assigned, 176 resolved, 8 reopened.
export const departments = [
  { name: 'Roads & Highways', assigned: 86, resolved: 61, avgDays: 6.2, reopened: 4 },
  { name: 'Waste Management', assigned: 64, resolved: 52, avgDays: 3.1, reopened: 2 },
  { name: 'Water Supply', assigned: 41, resolved: 30, avgDays: 4.8, reopened: 1 },
  { name: 'Electricity', assigned: 37, resolved: 33, avgDays: 2.4, reopened: 1 },
]

// Mock only: the code a department officer enters on their profile to prove
// which department they work for. Every department in the list above has one.
// A real backend would check the code itself and never ship it to the browser.
export const DEPARTMENT_CODES = {
  'Roads & Highways': 'RH-4821',
  'Waste Management': 'WM-3307',
  'Water Supply': 'WS-5190',
  Electricity: 'EL-2764',
}

// The periods on the Accountability screen. 8 weeks is the default, so the
// screen and Home show the same figures.
export const ACCOUNTABILITY_PERIODS = [
  { weeks: 4, label: 'Last 4 weeks' },
  { weeks: 8, label: 'Last 8 weeks' },
]
export const DEFAULT_PERIOD_WEEKS = 8

// The last 4 weeks, made up to match the last 4 points of weeklyReports below
// (124 received, 104 resolved). Counts are each department's 8-week share,
// rounded so they add up exactly; days and reopened are a little better than
// over 8 weeks, like the rising resolved line.
const departmentsLast4Weeks = [
  { name: 'Roads & Highways', assigned: 47, resolved: 36, avgDays: 5.8, reopened: 2 },
  { name: 'Waste Management', assigned: 35, resolved: 31, avgDays: 2.9, reopened: 1 },
  { name: 'Water Supply', assigned: 22, resolved: 18, avgDays: 4.5, reopened: 1 },
  { name: 'Electricity', assigned: 20, resolved: 19, avgDays: 2.2, reopened: 0 },
]

// The single source for each period: the stat cards and the table come from
// these rows, and their totals match the chart's weeks.
export const departmentsByPeriod = {
  4: departmentsLast4Weeks,
  8: departments,
}

export const waitingLongest = [
  { title: 'Broken drain cover by Chaktai Khal', department: 'Water Supply', days: 21 },
  { title: 'Potholes along Tiger Pass Road', department: 'Roads & Highways', days: 18, reopened: true },
  { title: 'Streetlight out on Jamal Khan Road', department: 'Electricity', days: 14 },
  { title: 'Garbage pile behind the Bahaddarhat bus stand', department: 'Waste Management', days: 12 },
]

// Made up to add up to 228 received and 176 resolved. Compare with the Figma chart.
export const weeklyReports = [
  { week: 'W1', received: 22, resolved: 14 },
  { week: 'W2', received: 25, resolved: 17 },
  { week: 'W3', received: 27, resolved: 19 },
  { week: 'W4', received: 30, resolved: 22 },
  { week: 'W5', received: 28, resolved: 23 },
  { week: 'W6', received: 31, resolved: 26 },
  { week: 'W7', received: 33, resolved: 27 },
  { week: 'W8', received: 32, resolved: 28 },
]