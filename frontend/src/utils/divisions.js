// Bangladesh has 8 divisions. A citizen can only report inside the division
// they chose in their profile. Keep this list the same as the backend's
// backend/src/constants/divisions.js.

export const DIVISIONS = [
  'Barishal',
  'Chattogram',
  'Dhaka',
  'Khulna',
  'Mymensingh',
  'Rajshahi',
  'Rangpur',
  'Sylhet',
]

// OpenStreetMap writes the division as "Dhaka Division", and some older names
// differently (Barisal, Chittagong). This turns any of them into our name.
const OLD_NAMES = { barisal: 'Barishal', chittagong: 'Chattogram' }

export function divisionFromPlaceName(value) {
  const name = String(value ?? '')
    .replace(/\bdivision\b/i, '')
    .trim()
  if (!name) return ''
  const fixed = OLD_NAMES[name.toLowerCase()] ?? name
  return DIVISIONS.find((d) => d.toLowerCase() === fixed.toLowerCase()) ?? ''
}

export function checkDivision(value) {
  return DIVISIONS.includes(value) ? '' : 'Please choose your division.'
}

// The one rule, used by "report" and "edit report". Returns '' when allowed,
// otherwise a sentence for the citizen.
export function checkReportDivision(citizenDivision, pinDivision) {
  if (!citizenDivision) return 'Choose your division in your profile before you report.'
  if (!pinDivision) {
    return 'We could not confirm which division this pin is in. Check your connection and move the pin a little to try again.'
  }
  if (pinDivision !== citizenDivision) {
    return `You can only report inside your division (${citizenDivision}). This pin is in ${pinDivision}.`
  }
  return ''
}
