import PopupActions from '../Map/PopupActions'

// Upvote and Follow, the same buttons and rules as in the map popup
// (guests get "Log in to…", staff accounts get a short note).
export default function DetailActions({ issue, viewer, onToggleVote, onToggleFollow }) {
  return (
    <section aria-label="Actions">
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
