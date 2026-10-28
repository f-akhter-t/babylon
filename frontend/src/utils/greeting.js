// Greetings for the home page. Pure functions of a Date, so they are easy to test.

// Part of the day, by the local hour.
export function dayPart(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 15) return 'noon'
  if (h >= 15 && h < 18) return 'afternoon'
  return 'evening'
}

// English text for each part of the day (bn.js has the Bangla for each).
export const GREETINGS = {
  morning: 'Good morning, {name}',
  noon: 'Good day, {name}',
  afternoon: 'Good afternoon, {name}',
  evening: 'Good evening, {name}',
}

// Days the country marks. Months are 1 to 12. Pohela Boishakh is on 14 April.
const NATIONAL_DAYS = [
  { month: 2, day: 21, text: 'Today is Language Martyrs’ Day. We remember.' },
  { month: 3, day: 26, text: 'Happy Independence Day, Bangladesh.' },
  { month: 4, day: 14, text: 'Shubho Noboborsho! Happy Bengali New Year.' },
  { month: 12, day: 16, text: 'Happy Victory Day, Bangladesh.' },
]

export function nationalDay(date = new Date()) {
  return NATIONAL_DAYS.find((d) => d.month === date.getMonth() + 1 && d.day === date.getDate()) ?? null
}
