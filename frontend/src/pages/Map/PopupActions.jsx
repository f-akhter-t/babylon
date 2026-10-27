import { useState } from 'react'
import clsx from 'clsx'
import Button from '../../components/ui/Button'
import { ArrowDownIcon, ArrowUpIcon, BellIcon } from './MapIcons'
import LoginPrompt from './LoginPrompt'
import { useNumber, useT } from '../../i18n/useLanguage'

// Upvote, Follow and Details for one issue. Used in the map popup, and can be
// used on the Issue detail page with showDetails={false}.
//   Citizens: the buttons work.
//   Guests: the same buttons, but clicking opens "Log in to …".
//   Department and admin accounts: only Details, with a short note.
// followLabel: show the word "Follow" next to the bell (Issue detail page).
export default function PopupActions({
  issue,
  viewer,
  onToggleVote,
  onToggleFollow,
  showDetails = true,
  followLabel = false,
}) {
  const t = useT()
  const n = useNumber()
  const [prompt, setPrompt] = useState(null) // 'upvote' | 'follow' | null
  const { voted, votes, followed } = issue
  const staff = !viewer.isGuest && !viewer.canAct

  const vote = () => (viewer.canAct ? onToggleVote(issue.id) : setPrompt('upvote'))
  const follow = () => (viewer.canAct ? onToggleFollow(issue.id) : setPrompt('follow'))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {!staff && (
          <>
            <Button
              onClick={vote}
              // "!" so the red wins over the button's own green background
              className={clsx('flex-1', voted && 'bg-danger! hover:bg-danger/90!')}
            >
              {/* After voting, the same button takes the vote back. */}
              {voted ? <ArrowDownIcon size={16} /> : <ArrowUpIcon size={16} />}
              {voted ? t('Downvote') : t('Upvote')} · {n(votes)}
            </Button>
            <button
              type="button"
              onClick={follow}
              aria-pressed={viewer.canAct ? followed : undefined}
              // With a visible word, that word is the name; without one, aria-label is.
              aria-label={
                followLabel ? undefined : followed ? t('Unfollow this issue') : t('Follow this issue')
              }
              title={followed ? t('Following: click to unfollow') : t('Follow for status updates')}
              className={clsx(
                'flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-navy transition motion-safe:active:scale-90',
                followLabel ? 'px-5 text-sm font-semibold' : 'w-11',
                followed ? 'bg-ink text-brand' : 'text-navy hover:bg-ink/10',
              )}
            >
              <BellIcon size={18} className={clsx(followed && 'fill-current')} />
              {followLabel && (followed ? t('Following') : t('Follow'))}
            </button>
          </>
        )}
        {showDetails && (
          // text-navy! beats Leaflet's blue link colour
          <Button
            variant="outline"
            to={`/issues/${issue.id}`}
            className={clsx('text-navy!', staff && 'flex-1')}
          >
            {t('Details')}
          </Button>
        )}
      </div>

      {staff && <span className="text-xs text-soft">{t('Only citizens can upvote and follow.')}</span>}
      {viewer.canAct && followed && (
        <span className="text-xs font-medium text-accent">
          {t('Following. You will get alerts when this issue changes.')}
        </span>
      )}
      {prompt && <LoginPrompt action={prompt} onClose={() => setPrompt(null)} />}
    </div>
  )
}
