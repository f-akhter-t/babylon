// Sample identity submissions for the admin's Identity checks queue, so the
// queue is not empty on a fresh browser. These are made-up people, separate
// from real signups. Like real submissions, they only carry the last 4 digits
// of the NID number. Decisions on them are kept in memory, so a reload starts
// the demo queue again.

export const sampleIdentitySubmissions = [
  {
    id: 'sample-1',
    name: 'Rafiq Hossain',
    email: 'rafiq.hossain@example.com',
    nidLast4: '4821',
    submittedDaysAgo: 3,
  },
  {
    id: 'sample-2',
    name: 'Sumaiya Akter',
    email: 'sumaiya.akter@example.com',
    nidLast4: '0937',
    submittedDaysAgo: 2,
  },
  {
    id: 'sample-3',
    name: 'Tanvir Chowdhury',
    email: 'tanvir.c@example.com',
    nidLast4: '5560',
    submittedDaysAgo: 1,
  },
  {
    id: 'sample-4',
    name: 'Maliha Rahman',
    email: 'maliha.rahman@example.com',
    nidLast4: '2174',
    submittedDaysAgo: 0,
  },
]
