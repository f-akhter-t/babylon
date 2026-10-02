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

export const accountabilityPeriod = 'Last 8 weeks'

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