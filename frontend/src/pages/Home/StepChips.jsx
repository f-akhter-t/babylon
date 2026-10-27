import { CameraIcon, PinIcon } from './HomeIcons'
import { useT } from '../../i18n/useLanguage'

const chip =
  'inline-flex h-11 cursor-default select-none items-center gap-2 rounded-full border border-forest/20 bg-white px-4 text-sm font-bold text-navy'
export default function StepChips() {
  const t = useT()
  return (
    <div className="flex flex-wrap gap-2">
      <span className={chip}>
        <CameraIcon className="size-4 text-forest" /> {t('Photo')}
      </span>
      <span className={chip}>
        <PinIcon className="size-4 text-forest" /> {t('Pin')}
      </span>
      <span className="inline-flex h-11 cursor-default select-none items-center rounded-full bg-forest px-4 text-sm font-bold text-mint">
        {t('Roads')}
      </span>
    </div>
  )
}