import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { animate, SHAKE } from '../../components/ui/motion'

const OTP_LENGTH = 6

// Six boxes for the one-time code, one digit each.
//   digits:    array of 6 strings ('' for an empty box)
//   onChange:  called with the new array
//   shake:     a number; each time it goes up, the boxes shake (wrong code)
//   firstRef:  focus this to put the cursor in the first box
// Typing moves to the next box, Backspace on an empty box moves back,
// arrow keys move between boxes, and pasting fills as many boxes as it can.
export default function OtpInput({ digits, onChange, disabled, invalid, shake, firstRef, labelId }) {
  const boxes = useRef([])
  const group = useRef(null)

  useEffect(() => {
    if (shake) animate(group.current, SHAKE, { duration: 400, easing: 'ease-in-out' })
  }, [shake])

  function focusBox(index) {
    const box = boxes.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]
    box?.focus()
    box?.select()
  }

  // Puts the digits in, starting at a box. Returns where the cursor should go.
  function fill(start, text) {
    const incoming = text.replace(/\D/g, '').split('')
    if (incoming.length === 0) return start
    const next = [...digits]
    let index = start
    for (const digit of incoming) {
      if (index >= OTP_LENGTH) break
      next[index] = digit
      index += 1
    }
    onChange(next)
    return index
  }

  function handleChange(e, index) {
    const value = e.target.value
    if (value === '') {
      const next = [...digits]
      next[index] = ''
      onChange(next)
      return
    }
    // Phones can put the whole code into one box (autocomplete one-time-code).
    focusBox(fill(index, value))
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      onChange(next)
      focusBox(index - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(index + 1)
    }
  }

  function handlePaste(e, index) {
    e.preventDefault()
    focusBox(fill(index, e.clipboardData.getData('text')))
  }

  return (
    <div ref={group} role="group" aria-labelledby={labelId} className="flex gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            boxes.current[index] = el
            if (index === 0 && firstRef) firstRef.current = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          aria-invalid={invalid || undefined}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          onFocus={(e) => e.target.select()}
          className={clsx(
            'h-12 w-10 rounded-tile border-2 bg-white text-center font-heading text-xl font-extrabold text-navy transition sm:h-14 sm:w-12',
            'focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40',
            'disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-slate',
            invalid ? 'border-danger' : digit ? 'border-forest/60' : 'border-navy/15',
          )}
        />
      ))}
    </div>
  )
}
