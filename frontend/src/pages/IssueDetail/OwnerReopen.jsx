import { useState } from 'react'
import { reopenReport } from '../../services/extraApi'
import { useT } from '../../i18n/useLanguage'

// "This problem came back" for the citizen who reported a FIXED issue.
// Put it in IssueView.jsx right after <OwnerEdit />. It shows nothing for anyone else.
// issue.mine comes from the server (toIssueJSON), so the owner is never guessed here.
// onReopened (optional): call your issue refetch so the page shows the new state.
export default function OwnerReopen({ issue, onReopened }) {
  const t = useT()
  const [stage, setStage] = useState('idle') // idle | confirm | busy | done
  const [error, setError] = useState('')

  const fixed = issue.status === 'resolved' && issue.verification === 'verified'
  if (!issue.mine || (!fixed && stage !== 'done')) return null

  async function submit() {
    setStage('busy')
    setError('')
    try {
      await reopenReport(issue.id)
      setStage('done')
      onReopened?.()
    } catch (err) {
      setError(err.message)
      setStage('confirm')
    }
  }

  if (stage === 'done') {
    return (
      <p role="status" className="rounded-[18px] bg-amber/25 px-4 py-3 font-body text-sm font-semibold text-navy">
        {t('You reopened this report. An admin will review it, and you will get a notice.')}
      </p>
    )
  }

  if (stage === 'idle') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setStage('confirm')}
          className="rounded-full border border-navy px-4 py-2 font-body text-sm font-semibold text-navy transition hover:bg-navy hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
        >
          {t('This problem came back')}
        </button>
        <span className="text-xs text-slate">{t('Use this if the problem came back after the fix.')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-mint p-4">
      <p className="font-body text-sm font-bold text-navy">{t('Send this report back to the admin?')}</p>
      {error && (
        <p role="alert" className="font-body text-sm font-semibold text-amber-dark">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={stage === 'busy'}
          className="rounded-full bg-forest px-4 py-2 font-body text-sm font-bold text-mint transition enabled:hover:-translate-y-0.5 disabled:opacity-50"
        >
          {stage === 'busy' ? t('Sending…') : t('Send to the admin')}
        </button>
        <button
          type="button"
          onClick={() => setStage('idle')}
          disabled={stage === 'busy'}
          className="rounded-full border border-navy px-4 py-2 font-body text-sm font-semibold text-navy"
        >
          {t('Cancel')}
        </button>
      </div>
    </div>
  )
}
