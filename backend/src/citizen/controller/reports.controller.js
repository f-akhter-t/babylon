// Thin: read the request, call ONE service function, send the response.
import * as service from '../service/reports.service.js'
import { success } from '../../utils/response.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

// The owner is always the email from the token. Never req.body.
export async function createReport(req, res, next) {
  try {
    const report = await service.createReport(req.user.email, req.body)
    return success(res, MESSAGES.REPORT_CREATED, report, 201)
  } catch (err) {
    return next(err)
  }
}

export async function listMyReports(req, res, next) {
  try {
    const reports = await service.listMyReports(req.user.email)
    return success(res, MESSAGES.REPORTS_LISTED, reports)
  } catch (err) {
    return next(err)
  }
}

export async function getMyReport(req, res, next) {
  try {
    const report = await service.getMyReport(req.user.email, req.params.id)
    return success(res, MESSAGES.REPORT_LOADED, report)
  } catch (err) {
    return next(err)
  }
}

export async function updateReport(req, res, next) {
  try {
    const report = await service.updateReport(req.user.email, req.params.id, req.body)
    return success(res, MESSAGES.REPORT_UPDATED, report)
  } catch (err) {
    return next(err)
  }
}

export async function deleteReport(req, res, next) {
  try {
    const result = await service.deleteReport(req.user.email, req.params.id)
    return success(res, MESSAGES.REPORT_DELETED, result)
  } catch (err) {
    return next(err)
  }
}