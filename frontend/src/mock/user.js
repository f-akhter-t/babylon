export const currentUser = {
  name: 'Nadia R.',
  initials: 'NR',
  role: 'Reporter',
  level: 2,
  points: 240,
  nextTierAt: 300, // "60 points to add the next tier"
}

export const earnPoints = [
  'A clear photo of the problem',
  'An exact pin on the map',
  'Upvotes from neighbours',
  'Reports that end up verified as fixed',
]

// group is used by the filter chips: status | nearby | reopened
// kind picks the icon: progress | nearby | verified | reopened
export const alerts = [
  {
    id: 'a1',
    group: 'nearby',
    kind: 'nearby',
    title: 'Similar report nearby',
    body: 'Overflowing bins at Lalkhan Bazar market, 560 m from you. Upvote instead of reporting again.',
    issueId: 3,
    unread: true,
  },
  {
    id: 'a2',
    group: 'status',
    kind: 'verified',
    title: 'Resolved and verified',
    time: 'Yesterday',
    body: 'Burst water pipe by the school gate. The admin checked the after-photo. You earned points.',
    issueId: 6,
    unread: true,
  },
  {
    id: 'a3',
    group: 'status',
    kind: 'progress',
    title: 'Your report was sent to Roads & Highways',
    time: '2 days ago',
    body: 'Deep pothole near Wasa Circle. The department will start work soon.',
    issueId: 1,
    unread: true,
  },
  {
    id: 'a4',
    group: 'reopened',
    kind: 'reopened',
    title: 'A fixed problem came back',
    time: '2 days ago',
    body: 'Pothole on Tiger Pass Road was reopened and sent to the admin.',
    issueId: 4,
    unread: false,
  },
]