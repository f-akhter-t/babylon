// Bangladesh has 8 divisions. A citizen can only report inside the division
// they chose in their profile. Keep this list the same as the frontend's
// frontend/src/utils/divisions.js.
export const DIVISIONS = Object.freeze([
  'Barishal',
  'Chattogram',
  'Dhaka',
  'Khulna',
  'Mymensingh',
  'Rajshahi',
  'Rangpur',
  'Sylhet',
])

export const isDivision = (value) => DIVISIONS.includes(value)
