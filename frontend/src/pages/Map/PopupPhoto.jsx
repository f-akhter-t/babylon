import { useState } from 'react'
import { CameraIcon } from './MapIcons'
import { useT } from '../../i18n/useLanguage'

// The citizen's photo, or a camera placeholder if there is none
// (or the file is missing).
export default function PopupPhoto({ issue }) {
  const t = useT()
  const [failed, setFailed] = useState(false)

  if (issue.beforeImg && !failed) {
    return (
      <img
        src={issue.beforeImg}
        alt={t('Photo of {title}', { title: issue.title })}
        onError={() => setFailed(true)}
        className="size-18 shrink-0 rounded-tile object-cover"
      />
    )
  }
  return (
    <div className="flex size-18 shrink-0 items-center justify-center rounded-tile bg-slate text-paper">
      <CameraIcon size={22} />
      <span className="sr-only">{t('No photo yet')}</span>
    </div>
  )
}
