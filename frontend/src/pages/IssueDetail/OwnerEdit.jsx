import Button from '../../components/ui/Button'
import { LOCKED_MESSAGE } from '../../services/api'
import { PencilIcon } from './DetailIcons'

// "Edit" for the citizen who reported this issue (access from canEditIssue).
// Once work has started the button stays, but disabled, with the reason.
export default function OwnerEdit({ issueId, access }) {
  if (access === 'ok') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          to={`/issues/${issueId}/edit`}
          state={{ fromDetail: true }}
          className="py-2"
        >
          <PencilIcon size={16} />
          Edit
        </Button>
        <span className="text-xs text-slate">This is your report. You can change it until work starts.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        aria-disabled="true"
        aria-describedby="edit-locked-reason"
        className="cursor-not-allowed py-2 opacity-50 active:scale-100"
      >
        <PencilIcon size={16} />
        Edit
      </Button>
      <span id="edit-locked-reason" className="text-xs font-medium text-slate">
        {LOCKED_MESSAGE}
      </span>
    </div>
  )
}
