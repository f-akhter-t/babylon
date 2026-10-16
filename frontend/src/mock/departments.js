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

// Mock only: the staff list each Employee ID is checked against. Department
// accounts use their department's list, admins the 'admin' list. The first ID
// in the Roads & Highways and admin lists belongs to the demo accounts.
// A real backend would keep this list on the server and check IDs there.
export const EMPLOYEE_ROSTER = {
  'Roads & Highways': ['E-RH-1001', 'E-RH-1002', 'E-RH-1003', 'E-RH-1004', 'E-RH-1005'],
  'Waste Management': ['E-WM-2001', 'E-WM-2002', 'E-WM-2003', 'E-WM-2004', 'E-WM-2005'],
  'Water Supply': ['E-WS-3001', 'E-WS-3002', 'E-WS-3003', 'E-WS-3004', 'E-WS-3005'],
  Electricity: ['E-EL-4001', 'E-EL-4002', 'E-EL-4003', 'E-EL-4004', 'E-EL-4005'],
  admin: ['E-AD-9001', 'E-AD-9002', 'E-AD-9003', 'E-AD-9004', 'E-AD-9005'],
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