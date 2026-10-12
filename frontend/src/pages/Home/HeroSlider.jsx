import { useEffect, useState } from 'react'
import clsx from 'clsx'
import SliderDots from '../../components/ui/SliderDots'
import HeroSlide from './HeroSlide'
import HeroVideo from './HeroVideo'
import HeroSearchCard from './HeroSearchCard'
import useVideoAllowed from './useVideoAllowed'

// Clips are 8 seconds long, so each slide stays 8 seconds.
const SLIDE_MS = 8000

export default function HeroSlider({ slides = [], categories = [] }) {
  const [index, setIndex] = useState(0)
  // People who turn on "reduce motion" start paused. They see the poster image.
  const [userPaused, setUserPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  // True while the mouse is over the hero or focus is inside it.
  const [hold, setHold] = useState(false)
  const count = slides.length
  const videoAllowed = useVideoAllowed()

  useEffect(() => {
    if (userPaused || hold || count < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
    return () => clearInterval(id)
    // "index" is here so the timer restarts after a manual click.
  }, [userPaused, hold, count, index])

  // Keeps the navy block in place while data loads.
  if (count === 0) return <section className="min-h-[560px] bg-navy md:min-h-[720px]" />

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Babylon highlights"
      className="relative isolate overflow-hidden bg-navy"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHold(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHold(false)
      }}
    >
      {/* Video layers sit behind everything. The overlay is darker on the left,
          where the text is. Change the /90 and /50 numbers to adjust it. */}
      <div className="absolute inset-0 -z-10">
        {slides.map((slide, i) => (
          <HeroVideo
            key={slide.id}
            video={slide.video}
            active={i === index}
            paused={userPaused}
            allowed={videoAllowed}
          />
        ))}
        <div className="absolute inset-0 bg-navy/70 md:bg-transparent md:bg-linear-to-r md:from-navy/75 md:via-navy/35 md:to-navy/5" />
      </div>

      <div className="px-5 pb-24 pt-8 md:px-10 md:pt-12 xl:px-18">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:items-center xl:grid-cols-[1fr_400px]">
          {/* Text slides share one grid cell, so the height of the tallest one
              is kept and nothing jumps. */}
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
                <HeroSlide slide={slide} active={i === index} as={i === 0 ? 'h1' : 'h2'} />
              </div>
            ))}
          </div>

          <HeroSearchCard categories={categories} />
        </div>

        <div className="mt-8 flex items-center gap-4">
          <SliderDots count={count} active={index} onSelect={setIndex} />
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            className="min-h-11 px-2 text-sm font-semibold text-mint underline-offset-4 hover:underline"
          >
            {userPaused ? 'Play slides' : 'Pause slides'}
          </button>
        </div>
      </div>
    </section>
  )
}