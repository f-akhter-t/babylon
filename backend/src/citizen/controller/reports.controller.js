// Thin: read the request, call ONE service function, send the response.
import * as service from '../service/reports.service.js'
import { success } from '../../utils/response.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

// The owner is always the email from the token. Never req.body.
export async function createReport(req, res) {
  success(res, MESSAGES.REPORT_CREATED, await service.createReport(req.user.email, req.valid.body), 201)
}

export async function listMyReports(req, res) {
  success(res, MESSAGES.REPORTS_LISTED, await service.listMyReports(req.user.email))
}

export async function getMyReport(req, res) {
  success(res, MESSAGES.REPORT_LOADED, await service.getMyReport(req.user.email, req.valid.params.id))
}

export async function updateReport(req, res) {
  const report = await service.updateReport(req.user.email, req.valid.params.id, req.valid.body)
  success(res, MESSAGES.REPORT_UPDATED, report)
}

export async function deleteReport(req, res) {
  success(res, MESSAGES.REPORT_DELETED, await service.deleteReport(req.user.email, req.valid.params.id))
}