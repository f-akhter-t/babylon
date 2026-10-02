import { useEffect, useState } from 'react'
import clsx from 'clsx'
import SliderDots from '../../components/ui/SliderDots'
import HeroSlide from './HeroSlide'

const SLIDE_MS = 6000

export default function HeroSlider({ slides = [], issue, fixedIssue }) {
  const [index, setIndex] = useState(0)
  // People who turn on "reduce motion" start with autoplay off.
  const [userPaused, setUserPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  // True while the mouse is over the hero or focus is inside it.
  const [hold, setHold] = useState(false)
  const count = slides.length

  useEffect(() => {
    if (userPaused || hold || count < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
    return () => clearInterval(id)
    // "index" is here so the timer restarts after a manual click.
  }, [userPaused, hold, count, index])

  // Keeps the navy block in place while data loads.
  if (count === 0) return <section className="min-h-[720px] bg-navy" />

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Babylon highlights"
      className="bg-navy px-5 pb-24 pt-8 md:px-10 md:pt-12 xl:px-18"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      {/* All slides sit in the same grid cell, so the section keeps the
          height of the tallest slide and nothing jumps. */}
      <div className="grid">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            inert={i !== index}
            className={clsx(
              'col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          >
            <HeroSlide
              slide={slide}
              as={i === 0 ? 'h1' : 'h2'}
              issue={issue}
              fixedIssue={fixedIssue}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <SliderDots count={count} active={index} onSelect={setIndex} />
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          className="text-sm font-semibold text-mint underline-offset-4 hover:underline"
        >
          {userPaused ? 'Play slides' : 'Pause slides'}
        </button>
      </div>
    </section>
  )
}
