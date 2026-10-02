// Text for the hero slider. Pages read this through services/api.js.
// "visual" picks the picture: map, vote or proof.

const perks = [
  "Upvote, don't duplicate",
  'Photo proof to close',
  'Live status updates',
]

export const heroSlides = [
  {
    id: 'report',
    badge: 'Civic issue reporting',
    headline: ['See it.', 'Pin it.'],
    accent: ['Watch it', 'get fixed.'],
    text: 'Report potholes, broken bridges and uncollected garbage on the map. Follow every report from Open to Resolved, with photo proof before it closes.',
    primary: { label: 'Report an issue', to: '/report' },
    secondary: { label: 'Explore the map', to: '/map' },
    perks,
    visual: 'map',
  },
  {
    id: 'upvote',
    badge: "Upvote, don't duplicate",
    headline: ['Already reported?'],
    accent: ['Add your vote.'],
    text: 'See the same problem on the map? Upvote it instead of filing it again. More votes move a report higher, so the right team sees it sooner.',
    primary: { label: 'Report an issue', to: '/report' },
    secondary: { label: 'Browse the feed', to: '/feed' },
    perks,
    visual: 'vote',
  },
  {
    id: 'proof',
    badge: 'Photo proof to close',
    headline: ['Fixed?', 'Show it.'],
    accent: ['Admin checks', 'before it closes.'],
    text: 'The department uploads an after-photo. An admin checks it before the issue can close. If the problem comes back, it reopens.',
    primary: { label: 'Report an issue', to: '/report' },
    secondary: { label: 'See fixed issues', to: '/feed' },
    perks,
    visual: 'proof',
  },
]
