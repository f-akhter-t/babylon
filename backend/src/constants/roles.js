// The three kinds of account. Used by authorize() and by the services.
export const ROLES = Object.freeze({
  CITIZEN: 'citizen',
  DEPARTMENT: 'department',
  ADMIN: 'admin',
})

export const ALL_ROLES = Object.freeze(Object.values(ROLES))
