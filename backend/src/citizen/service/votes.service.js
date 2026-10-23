// Voting rules. Owner-independent: any citizen may vote on any issue.
import mongoose from 'mongoose'
import Issue from '../../models/issue.model.js'
import Vote from '../../models/vote.model.js'
import AppError from '../../utils/AppError.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

const clean = (email) => String(email).trim().toLowerCase()

async function findIssue(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('not-found', 404, MESSAGES.REPORT_NOT_FOUND)
  }
  const issue = await Issue.findById(id)
  if (!issue) throw new AppError('not-found', 404, MESSAGES.REPORT_NOT_FOUND)
  return issue
}

async function result(issue, voted) {
  const votes = await Vote.countDocuments({ issueId: issue._id })
  return { id: String(issue._id), votes, voted }
}

// Idempotent: voting twice counts once.
export async function addVote(email, id) {
  const issue = await findIssue(id)
  if (issue.status === 'resolved') throw new AppError('conflict', 409, MESSAGES.VOTE_CLOSED)
  await Vote.updateOne(
    { issueId: issue._id, userEmail: clean(email) },
    { $setOnInsert: { issueId: issue._id, userEmail: clean(email) } },
    { upsert: true },
  )
  return result(issue, true)
}

// Removing a vote that does not exist is fine.
export async function removeVote(email, id) {
  const issue = await findIssue(id)
  await Vote.deleteOne({ issueId: issue._id, userEmail: clean(email) })
  return result(issue, false)
}