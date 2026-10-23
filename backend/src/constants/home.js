// What the Home page shows that does not come from the database: the hero
// slides and the search chips (copied from frontend/src/mock/heroSlides.js, so
// the text does not change), and the small limits of the Home lists.

const perks = ["Upvote, don't duplicate", 'Photo proof to close', 'Live status updates']

export const HERO_SLIDES = Object.freeze([
  {
    id: 'city',
    badge: 'Civic issue reporting',
    headline: ['Our city.', 'Our job.'],
    accent: ["Let's fix it", 'together.'],
    text: 'Report potholes, floods and uncollected garbage on the map. Follow every report from Open to Resolved, with photo proof before it closes.',
    primary: { label: 'Report an issue', to: '/report' },
    secondary: { label: 'Explore the map', to: '/map' },
    perks,
    video: { src: '/videos/city-skyline.mp4', poster: '/images/hero/city-skyline.jpg' },
  },
  {
    id: 'flood',
    badge: "Upvote, don't duplicate",
    headline: ['Flooded lane?'],
    accent: ['Report it.'],
    text: 'Pin the problem on the map. If someone already did, add your vote instead. More votes move a report higher, so the right team sees it sooner.',
    primary: { label: 'Report an issue', to: '/report' },
    secondary: { label: 'Browse the feed', to: '/feed' },
    perks,
    video: { src: '/videos/flooded-lane.mp4', poster: '/images/hero/flooded-lane.jpg' },
  },
  {
    id: 'crew',
    badge: 'Photo proof to close',
    headline: ['Someone', 'is on it.'],
    accent: ['Proof included.'],
    text: 'The department uploads an after-photo. An admin checks it before the issue can close. If the problem comes back, it reopens.',
    primary: { label: 'Report an issue', to: '/report' },
    secondary: { label: 'See fixed issues', to: '/feed' },
    perks,
    video: { src: '/videos/waste-workers.mp4', poster: '/images/hero/waste-workers.jpg' },
  },
])

// Chips in the hero search card.
export const HERO_CATEGORIES = Object.freeze(['Roads', 'Waste', 'Water', 'Lighting', 'Bridges'])

export const HOME_LIMITS = Object.freeze({
  fixedCount: 3, // "Fixed this week" shows the latest 3
  activityDefault: 8, // the ticker, newest first
  activityMax: 50,
})
