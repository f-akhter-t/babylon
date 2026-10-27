import Reveal from '../../components/ui/Reveal'
import SectionHeading from './SectionHeading'
import StepCard from './StepCard'
import StepChips from './StepChips'
import StepFlow from './StepFlow'
import BeforeAfterSlider from './BeforeAfterSlider'
import { useT } from '../../i18n/useLanguage'

export default function HowItWorksSection({ example }) {
  const t = useT()
  return (
    <section className="px-5 pt-16 md:px-10 xl:px-18">
      <Reveal>
        <SectionHeading eyebrow={t('How it works')} title={t('Three steps. One staircase.')} />
      </Reveal>

      <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-3 xl:items-end">
        <Reveal>
          <StepCard
            number="01"
            level={1}
            tone="mint"
            title={t('Report it')}
            text={t('Snap a photo, drop a pin, pick a category. Already reported? Upvote that one instead.')}
            className="xl:h-[330px]"
          >
            <StepChips />
          </StepCard>
        </Reveal>

        <Reveal delay={150}>
          <StepCard
            number="02"
            level={2}
            tone="forest"
            title={t('Track it')}
            text={t('Follow each report from Open to In progress to Resolved. Get notified about status changes and similar reports nearby.')}
            className="xl:h-[390px]"
          >
            <StepFlow />
          </StepCard>
        </Reveal>

        <Reveal delay={300}>
          <StepCard
            number="03"
            level={3}
            tone="navy"
            title={t("Prove it's fixed")}
            text={t('The department uploads an after-photo. An admin checks it before the issue can close. If the problem comes back, it reopens.')}
            className="xl:h-[450px]"
          >
            <BeforeAfterSlider
              before={example?.beforeImg}
              after={example?.afterImg}
              alt={example?.title}
              interactive={false}
              className="h-[118px] rounded-tile border-2 border-mint"
            />
          </StepCard>
        </Reveal>
      </div>
    </section>
  )
}