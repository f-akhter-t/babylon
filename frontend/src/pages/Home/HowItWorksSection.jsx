import SectionHeading from './SectionHeading'
import StepCard from './StepCard'
import StepChips from './StepChips'
import StepFlow from './StepFlow'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function HowItWorksSection() {
  return (
    <section className="px-18 pt-20">
      <SectionHeading eyebrow="How it works" title="Three steps. One staircase." />

      <div className="mt-10 grid grid-cols-3 items-end gap-5">
        <StepCard
          number="01"
          level={1}
          tone="mint"
          title="Report it"
          text="Snap a photo, drop a pin, pick a category. Already reported? Upvote that one instead."
          className="h-[330px]"
        >
          <StepChips />
        </StepCard>

        <StepCard
          number="02"
          level={2}
          tone="forest"
          title="Track it"
          text="Follow each report from Open to In progress to Resolved. Get notified about status changes and similar reports nearby."
          className="h-[390px]"
        >
          <StepFlow />
        </StepCard>

        <StepCard
          number="03"
          level={3}
          tone="navy"
          title="Prove it's fixed"
          text="The department uploads an after-photo. An admin checks it before the issue can close. If the problem comes back, it reopens."
          className="h-[450px]"
        >
          <BeforeAfterSlider
            interactive={false}
            className="h-32 rounded-tile border-2 border-white/80"
          />
        </StepCard>
      </div>
    </section>
  )
}