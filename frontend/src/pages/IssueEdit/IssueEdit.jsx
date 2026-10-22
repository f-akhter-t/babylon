import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import { canEditIssue, getIssueForEdit, LOCKED_MESSAGE } from '../../services/api'
import { useViewer } from '../Map/useViewer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { DetailLoading, DetailMessage } from '../IssueDetail/DetailStates'
import { setIssueNotice } from '../IssueDetail/issueNotice'
import EditForm from './EditForm'

// /issues/:id/edit. Only the citizen who reported the issue, and only while
// it is Open. Everyone else goes back to the issue with a short message.
export default function IssueEdit() {
  const { id } = useParams()
  const viewer = useViewer()
  const [result, setResult] = useState({ id: null, issue: null, error: false })

  useEffect(() => {
    let ignore = false
    getIssueForEdit(id)
      .then((issue) => {
        if (!ignore) setResult({ id, issue, error: false })
      })
      .catch(() => {
        if (!ignore) setResult({ id, issue: null, error: true })
      })
    return () => {
      ignore = true
    }
  }, [id])

  const loading = result.id !== id
  const issue = loading ? null : result.issue

  let refusal = null // why this person cannot edit, shown on the issue page
  if (issue) {
    if (viewer.isGuest) refusal = 'Log in as the citizen who reported this issue to edit it.'
    else if (!viewer.canAct) refusal = 'Only the citizen who reported this issue can edit it.'
    else {
      const access = canEditIssue(issue, viewer.session.email)
      if (access === 'not-owner') refusal = 'Only the citizen who reported this issue can edit it.'
      if (access === 'locked') refusal = LOCKED_MESSAGE
    }
  }

  let tabTitle = null
  if (issue && !refusal) tabTitle = 'Edit report'
  else if (!loading && !issue) tabTitle = result.error ? 'Could not load issue' : 'Issue not found'
  useDocumentTitle(tabTitle)

  if (refusal) {
    setIssueNotice(issue.id, refusal)
    return <Navigate to={`/issues/${issue.id}`} replace />
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <main className="relative min-h-[70vh] px-4 py-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          {loading && <DetailLoading />}
          {!loading && !issue && <DetailMessage error={result.error} />}
          {/* key: another issue starts a fresh form */}
          {issue && <EditForm key={issue.id} issue={issue} email={viewer.session.email} />}
        </div>
      </main>
      <Footer />
    </>
  )
}
