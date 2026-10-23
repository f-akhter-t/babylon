import { success } from '../../utils/response.js'
import { PUBLIC_MESSAGES as M } from '../../constants/messages/public.js'
import * as issues from '../../shared/service/issues.service.js'

// The viewer is the token's email (guests have none). Never read from the request.
const viewerOf = (req) => req.user?.email

const positionOf = ({ lat, lng }) => (lat === undefined ? undefined : [lat, lng])

export async function list(req, res) {
  const { category, status, search } = req.valid.query
  const data = await issues.listIssues({
    category,
    status,
    search,
    from: positionOf(req.valid.query),
    viewerEmail: viewerOf(req),
  })
  success(res, M.issuesLoaded, data)
}

export async function detail(req, res) {
  const data = await issues.getIssueDetail(req.valid.params.id, {
    from: positionOf(req.valid.query),
    viewerEmail: viewerOf(req),
  })
  success(res, M.issueLoaded, data)
}
