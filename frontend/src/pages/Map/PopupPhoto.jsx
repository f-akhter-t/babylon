import { useState } from 'react'
import { CameraIcon } from './MapIcons'

// The citizen's photo, or a camera placeholder if there is none
// (or the file is missing).
export default function PopupPhoto({ issue }) {
  const [failed, setFailed] = useState(false)

  if (issue.beforeImg && !failed) {
    return (
      <img
        src={issue.beforeImg}
        alt={`Photo of ${issue.title}`}
        onError={() => setFailed(true)}
        className="size-18 shrink-0 rounded-tile object-cover"
      />
    )
  }
  return (
    <div className="flex size-18 shrink-0 items-center justify-center rounded-tile bg-slate text-white">
      <CameraIcon size={22} />
      <span className="sr-only">No photo yet</span>
    </div>
  )
}
