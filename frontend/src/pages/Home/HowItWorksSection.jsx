import SectionHeading from './SectionHeading'
import StepCard from './StepCard'
import StepChips from './StepChips'
import StepFlow from './StepFlow'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function HowItWorksSection({ example }) {
  return (
    <section className="px-5 pt-16 md:px-10 xl:px-18">
      <SectionHeading eyebrow="How it works" title="Three steps. One staircase." />

      <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-3 xl:items-end">
        <StepCard
          number="01"
          level={1}
          tone="mint"
          title="Report it"
          text="Snap a photo, drop a pin, pick a category. Already reported? Upvote that one instead."
          className="xl:h-[330px]"
        >
          <StepChips />
        </StepCard>

        <StepCard
          number="02"
          level={2}
          tone="forest"
          title="Track it"
          text="Follow each report from Open to In progress to Resolved. Get notified about status changes and similar reports nearby."
          className="xl:h-[390px]"
        >
          <StepFlow />
        </StepCard>

        <StepCard
          number="03"
          level={3}
          tone="navy"
          title="Prove it's fixed"
          text="The department uploads an after-photo. An admin checks it before the issue can close. If the problem comes back, it reopens."
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
      </div>
    </section>
  )
}