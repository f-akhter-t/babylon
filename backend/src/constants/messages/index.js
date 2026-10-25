// One file per panel under constants/messages/, joined here, so two people
// never edit the same lines. Add your panel's file and one line below.
import { ADMIN_MESSAGES } from './admin.js'
import { ASSIST_MESSAGES } from './assist.js'
import { MESSAGES as CITIZEN_MESSAGES } from './citizen.js'
import { DEPARTMENT_MESSAGES } from './department.js'
import { PROFILE_MESSAGES } from './profile.js'
import { TRANSLATE_MESSAGES } from './translate.js'
import { CHAT_MESSAGES } from './chat.js'
import { REOPEN_MESSAGES } from './reopen.js'
import { WEEKLY_MESSAGES } from './weekly.js'

export const MSG = Object.freeze({
  ...ADMIN_MESSAGES,
  ...ASSIST_MESSAGES,
  ...CITIZEN_MESSAGES,
  ...DEPARTMENT_MESSAGES,
  ...PROFILE_MESSAGES,
  ...TRANSLATE_MESSAGES,
  ...CHAT_MESSAGES,
  ...REOPEN_MESSAGES,
  ...WEEKLY_MESSAGES,
})

export { COMMON } from './common.js'