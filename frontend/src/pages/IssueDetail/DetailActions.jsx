import PopupActions from '../Map/PopupActions'
import { useT } from '../../i18n/useLanguage'

// Upvote and Follow, the same buttons and rules as in the map popup
// (guests get "Log in to…", staff accounts get a short note).
export default function DetailActions({ issue, viewer, onToggleVote, onToggleFollow }) {
  const t = useT()
  return (
    <section aria-label={t('Actions')}>
      <PopupActions
        issue={issue}
        viewer={viewer}
        onToggleVote={onToggleVote}
        onToggleFollow={onToggleFollow}
        showDetails={false}
        followLabel
      />
    </section>
  )
}
