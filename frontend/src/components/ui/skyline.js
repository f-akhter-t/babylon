// The four buildings of the Babylon logo. Status icons draw the same shapes:
// the more buildings are solid, the closer the issue is to fixed.
export const SKYLINE = [
  { x: 9.8, y: 15, w: 2.6, h: 4.6 },
  { x: 13, y: 12.8, w: 3, h: 6.8 },
  { x: 16.6, y: 14.2, w: 2.6, h: 5.4 },
  { x: 19.7, y: 16.2, w: 2.2, h: 3.4 },
]
export const SKYLINE_VIEWBOX = '9.4 12.4 12.9 7.6'

// The old icons had three steps (1 to 3). The last step now lights all four.
export const litBuildings = (level) => [0, 1, 2, 4][Math.max(0, Math.min(3, level))] ?? 0
