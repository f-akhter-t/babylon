// status: 'open' | 'in_progress' | 'resolved' | 'reopened'
export const myReports = [
  {
    id: 1, title: 'Deep pothole on Station Road', category: 'Roads', location: 'Station Road, Ward 4',
    date: '24 Sep', status: 'in_progress', upvotes: 48, department: 'Roads & Highways',
    update: 'Repair crew scheduled · 2 hours ago',
    description: 'Large pothole in the left lane, about half a metre wide. Two-wheelers swerve to avoid it, especially after dark.',
    history: [
      ['Open', 'Reported 24 Sep'],
      ['Sent to Roads & Highways', '25 Sep'],
      ['In progress', '28 Sep · repair crew scheduled'],
    ],
  },
  {
    id: 2, title: 'Overflowing bins at Lake Street market', category: 'Waste', location: 'Lake Street',
    date: '21 Sep', status: 'in_progress', upvotes: 31, department: 'Waste Management',
    update: 'Collection crew scheduled · 2 hours ago',
    description: 'Bins have not been emptied for over a week and waste is spilling onto the footpath near the market entrance.',
    history: [
      ['Open', 'Reported 21 Sep'],
      ['Acknowledged by Waste Management', '22 Sep'],
      ['In progress', 'Today · crew scheduled'],
    ],
  },
  {
    id: 3, title: 'Pothole came back on Mill Road', category: 'Roads', location: 'Mill Road',
    date: '10 Sep', status: 'reopened', upvotes: 19, department: 'Roads & Highways',
    update: 'Reopened and sent to admin · 2 days ago',
    description: 'The patch repaired in August has cracked open again after the rain.',
    history: [
      ['Open', 'Reported 10 Sep'],
      ['Resolved', '12 Sep · verified by admin'],
      ['Reopened', 'Sent for inspection'],
    ],
  },
  {
    id: 4, title: 'Burst water pipe by the school gate', category: 'Water', location: 'School Lane',
    date: '3 Sep', status: 'resolved', upvotes: 52, department: 'Water Supply',
    update: 'Fix verified by admin · Yesterday',
    description: 'Water is flowing across the road outside the school gate every morning.',
    history: [
      ['Open', 'Reported 3 Sep'],
      ['In progress', '5 Sep'],
      ['Resolved', 'Yesterday · after-photo verified'],
    ],
  },
  {
    id: 5, title: 'Streetlight out on Park Avenue', category: 'Lighting', location: 'Park Avenue',
    date: '6 Oct', status: 'open', upvotes: 14, department: null, update: null,
    description: 'The streetlight near the bus stop has been off for several nights.',
    history: [['Open', 'Reported 6 Oct']],
  },
]

export const myPoints = { level: 2, title: 'Reporter', score: 240, toNext: 60, name: 'Nadia R.' }

export const pointRules = [
  'A clear photo of the problem',
  'An exact pin on the map',
  'Upvotes from neighbours',
  'Reports that end up verified as fixed',
]
