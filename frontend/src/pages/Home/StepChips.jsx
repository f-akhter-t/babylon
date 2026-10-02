import { CameraIcon, PinIcon } from './HomeIcons'

const chip =
  'inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white px-4 py-2 text-sm font-semibold text-navy'

export default function StepChips() {
  return (
    <div className="flex gap-2">
      <span className={chip}>
        <CameraIcon className="size-4 text-forest" /> Photo
      </span>
      <span className={chip}>
        <PinIcon className="size-4 text-forest" /> Pin
      </span>
      <span className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white">
        Roads
      </span>
    </div>
  )
}