import { success } from '../../utils/response.js'
import { AUTH_MESSAGES as M } from '../../constants/messages/auth.js'
import { MSG } from '../../constants/messages/index.js'
import * as staff from '../service/staff.service.js'

export const signup = async (req, res) =>
  success(res, M.staffSignedUp, await staff.signup(req.valid.body), 201)

export const verifyCode = async (req, res) =>
  success(res, M.departmentCodeOk, await staff.verifyDepartmentCode(req.user.email, req.valid.body.code))

export const verifyEmployee = async (req, res) =>
  success(res, M.employeeIdOk, await staff.verifyEmployeeId(req.user.email, req.valid.body.employeeId))

export const saveDetails = async (req, res) =>
  success(res, M.detailsSaved, await staff.saveDetails(req.user.email, req.valid.body))

export const savePhoto = async (req, res) =>
  success(res, M.photoSaved, await staff.savePhoto(req.user.email, req.valid.body.photo))

export const phoneCode = async (req, res) =>
  success(res, MSG.phoneCodeSent, await staff.requestPhoneCode(req.user.email, req.valid.body.phone))

export const phoneVerify = async (req, res) =>
  success(res, MSG.phoneVerified, await staff.verifyPhone(req.user.email, req.valid.body))

export const emailCode = async (req, res) =>
  success(res, MSG.emailCodeSent, await staff.requestEmailCode(req.user.email))

export const emailVerify = async (req, res) =>
  success(res, MSG.emailVerified, await staff.verifyEmail(req.user.email, req.valid.body.code))

export const finish = async (req, res) => success(res, M.setupDone, await staff.finish(req.user.email))
