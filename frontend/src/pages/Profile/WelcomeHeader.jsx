import Button from '../../components/ui/Button'
import CompletenessMeter from './CompletenessMeter'
import { enter } from '../../components/ui/motion'

// The first-time view of /profile, right after a new citizen signs up.
// "Skip for now" is a normal link, so unsaved changes are asked about first.
export default function WelcomeHeader({ name, profile, onSkip }) {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="flex flex-col gap-6 rounded-panel bg-mint/90 p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between md:gap-10 md:p-8"
      style={enter('rise-in', 0)}
    >
      <div className="max-w-xl">
        <h1
          id="welcome-heading"
          className="font-heading text-3xl font-extrabold text-navy md:text-5xl"
        >
          {`Welcome to Babylon, ${name}`}
        </h1>
        <p className="mt-2 font-body text-base text-navy">
          Let&apos;s set up your profile. Start with your name and division.
        </p>
        <p className="mt-1 font-body text-sm text-slate">
          Verifying your email, phone and identity is optional. You can do it any time from
          your profile.
        </p>
        <Button to="/map" variant="outline" className="mt-5" onClick={onSkip}>
          Skip for now
        </Button>
      </div>

      {profile && (
        <div className="w-full rounded-card bg-white/70 p-5 md:max-w-sm">
          <CompletenessMeter profile={profile} tone="light" size="lg" />
        </div>
      )}
    </section>
  )
}
