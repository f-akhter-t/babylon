import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { useFormat } from '../../i18n/useFormat'
import PopupPhoto from './PopupPhoto'
import PopupActions from './PopupActions'
import PopupShell from './PopupShell'
import { useT } from '../../i18n/useLanguage'

const WIDTH = { min: 310, max: 330 }
const PIN_HEIGHT = 50 // the selected pin (see statusPin.js)

// Shown only while an issue is selected. React decides when it is open,
// so the popup, the pin and the card always agree.
// Votes and follows live in Map.jsx, so the list updates too.
// It opens beside the pin (or docked at the bottom on phones), see PopupShell.
export default function MapPopup({ issue, viewer, onClose, onToggleVote, onToggleFollow }) {
  const t = useT()
  const format = useFormat()
  return (
    <PopupShell lat={issue.lat} lng={issue.lng} width={WIDTH} pinHeight={PIN_HEIGHT} waitForFly>
      <div className="relative flex flex-col gap-3 p-4 font-body text-navy">
        {/* A 44px tap area around the same small circle (centre unchanged). */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Close (Esc)')}
          className="group absolute right-0 top-0 flex size-11 items-center justify-center rounded-full text-lg leading-none text-muted hover:text-navy"
        >
          <span className="flex size-7 items-center justify-center rounded-full group-hover:bg-mint">
            ×
          </span>
        </button>

        <div className="flex gap-3 pr-6">
          <PopupPhoto issue={issue} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="font-heading text-base font-extrabold leading-tight">{issue.title}</h2>
            <span className="text-xs text-soft">
              {t(issue.category)} · {t('Reported {when}', { when: format.daysAgo(issue.daysAgo) })}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <StatusPill status={issue.status} className="px-2.5 py-0.5 text-xs" />
              <PriorityBadge priority={issue.priority} ai={issue.aiAssessed} />
            </div>
          </div>
        </div>

        <PopupActions
          issue={issue}
          viewer={viewer}
          onToggleVote={onToggleVote}
          onToggleFollow={onToggleFollow}
        />
      </div>
    </PopupShell>
  )
}
