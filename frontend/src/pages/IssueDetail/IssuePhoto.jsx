import { useState } from 'react'
import BeforeAfterSlider from '../Home/BeforeAfterSlider'
import { CameraIcon } from '../Map/MapIcons'
import { useT } from '../../i18n/useLanguage'

const FRAME = 'relative h-64 overflow-hidden rounded-panel bg-slate shadow-lg shadow-navy/10 sm:h-80 lg:h-88'

// Fixed issues: a before/after slider (the same one as on Home).
// Others: the citizen's "before" photo. If it fails to load, a slate
// placeholder (same idea as PopupPhoto on the map).
export default function IssuePhoto({ issue }) {
  const t = useT()
  const [failed, setFailed] = useState(false)

  if (issue.afterImg) {
    return (
      <figure>
        <BeforeAfterSlider
          before={issue.beforeImg}
          after={issue.afterImg}
          alt={issue.title}
          className={FRAME}
        />
        <figcaption className="mt-2 text-center text-xs text-soft">
          {t('Drag the handle, or use the arrow keys, to compare before and after.')}
        </figcaption>
      </figure>
    )
  }

  return (
    <figure className={FRAME}>
      {issue.beforeImg && !failed ? (
        <img
          src={issue.beforeImg}
          alt={t('Photo of {title}', { title: issue.title })}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center gap-2 text-sm font-medium text-paper">
          <CameraIcon size={20} />
          {t('Citizen photo')}
          <span className="sr-only">{t('(not available)')}</span>
        </div>
      )}
      <figcaption className="absolute bottom-4 left-4 rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wider text-paper">
        {t('Before')}
      </figcaption>
    </figure>
  )
}
