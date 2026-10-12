import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from './ProfileCard'
import TextField from './TextField'
import FormNotice from './FormNotice'
import VerifyBadge from './VerifyBadge'
import OtpInput from './OtpInput'
import CountdownRing from './CountdownRing'
import { DEMO_OTP, OTP_RESEND_SECONDS, requestOtp, verifyOtp } from '../../services/api'
import { checkPhone, normalizePhone } from '../../utils/profileRules'

const emptyCode = () => Array.from({ length: DEMO_OTP.length }, () => '')

// A check mark that draws itself, shown right after a number is verified.
function DrawnCheck() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/25 text-forest">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path
          d="M5 12.5 9.5 17 19 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          style={{ animation: 'checkDraw 0.5s ease-out 0.15s both' }}
        />
      </svg>
    </span>
  )
}

// step: 'view' (a verified number), 'edit' (typing a number), 'code' (waiting for the code)
export default function PhoneCard({ profile, onDirtyChange, announce }) {
  const [step, setStep] = useState(profile.phone ? 'view' : 'edit')
  const [phoneInput, setPhoneInput] = useState('')
  const [touched, setTouched] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(0)
  const [digits, setDigits] = useState(emptyCode)
  const [shake, setShake] = useState(0)
  const [locked, setLocked] = useState(false)
  const [busy, setBusy] = useState('') // '' | 'sending' | 'verifying'
  const [notice, setNotice] = useState(null) // { tone, text }
  // The number just verified, shown until the profile reloads with it.
  const [justVerified, setJustVerified] = useState('')
  const verifiedPhone = justVerified || profile.phone
  // Where focus should go after the step changes: { target, n }
  const [focusRequest, setFocusRequest] = useState(null)
  const firstBoxRef = useRef(null)
  const verifiedRef = useRef(null)

  const code = digits.join('')
  const phone = normalizePhone(phoneInput)
  const phoneError = checkPhone(phoneInput)
  const sameAsVerified = Boolean(verifiedPhone) && phone === verifiedPhone
  const canSend = !phoneError && !sameAsVerified && !busy
  const canVerify = /^\d{6}$/.test(code) && !locked && !busy
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000))

  const dirty = step === 'code' || (step === 'edit' && phoneInput.trim() !== '')
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  // Ticks the "Resend code in 0:25" countdown.
  useEffect(() => {
    if (step !== 'code' || resendAt <= Date.now()) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [step, resendAt])

  // Moves focus once the new step is on screen.
  useEffect(() => {
    if (focusRequest?.target === 'code') firstBoxRef.current?.focus()
    if (focusRequest?.target === 'verified') verifiedRef.current?.focus()
  }, [focusRequest])

  async function sendCode(number) {
    setBusy('sending')
    setNotice(null)
    try {
      const result = await requestOtp(profile.email, number)
      const sentAt = Date.now()
      setSentTo(result.phone)
      setNow(sentAt)
      setResendAt(sentAt + result.resendIn * 1000)
      setDigits(emptyCode())
      setLocked(false)
      setStep('code')
      setFocusRequest({ target: 'code', n: sentAt })
      announce(`We sent a 6-digit code to ${result.phone}. Type it in the boxes.`)
    } catch (err) {
      setNotice({ tone: 'error', text: err.message || 'We could not send a code. Please try again.' })
    } finally {
      setBusy('')
    }
  }

  function handleSend(e) {
    e.preventDefault()
    setTouched(true)
    if (canSend) sendCode(phone)
  }

  function wrongCode(text, lock) {
    setDigits(emptyCode())
    setShake((n) => n + 1)
    if (lock) setLocked(true)
    setNotice({ tone: 'error', text })
    if (!lock) setFocusRequest({ target: 'code', n: Date.now() })
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (!canVerify) return
    setBusy('verifying')
    setNotice(null)
    try {
      const result = await verifyOtp(profile.email, code)
      if (result.status === 'verified') {
        setJustVerified(result.profile.phone)
        setStep('view')
        setPhoneInput('')
        setTouched(false)
        const text = 'Your mobile number is verified.'
        setNotice({ tone: 'success', text })
        announce(text, { toast: true })
        setFocusRequest({ target: 'verified', n: Date.now() })
      } else if (result.status === 'wrong') {
        wrongCode(
          result.attemptsLeft === 1
            ? 'That code is not right. You have 1 try left.'
            : `That code is not right. You have ${result.attemptsLeft} tries left.`,
          false,
        )
      } else if (result.status === 'locked') {
        wrongCode('Too many wrong codes. Ask for a new code to try again.', true)
      } else {
        wrongCode('This code has expired. Ask for a new code.', true)
      }
    } catch {
      setNotice({ tone: 'error', text: 'We could not check the code. Please try again.' })
    } finally {
      setBusy('')
    }
  }

  function startEdit() {
    setStep('edit')
    setPhoneInput('')
    setTouched(false)
    setNotice(null)
  }

  function cancel() {
    setStep(verifiedPhone ? 'view' : 'edit')
    setPhoneInput('')
    setTouched(false)
    setDigits(emptyCode())
    setNotice(null)
  }

  const resendLabel =
    secondsLeft > 0
      ? `Resend code in 0:${String(secondsLeft).padStart(2, '0')}`
      : 'Resend code'

  return (
    <ProfileCard
      id="profile-phone"
      title="Mobile number"
      intro="A verified number lets departments call you about your reports."
      badge={<VerifyBadge status={verifiedPhone ? 'verified' : 'not-verified'} />}
    >
      <div className="flex flex-col gap-4">
        {step === 'view' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-white/70 px-4 py-3">
            <div
              ref={verifiedRef}
              tabIndex={-1}
              className="flex items-center gap-3 rounded-chip focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
            >
              {justVerified && <DrawnCheck />}
              <div>
                <p className="font-body text-xs text-muted">Verified number</p>
                <p className="font-body text-base font-bold tracking-wide text-navy">
                  {verifiedPhone}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={startEdit}>
              Change number
            </Button>
          </div>
        )}

        {step === 'edit' && (
          <form onSubmit={handleSend} noValidate className="flex flex-col gap-4">
            <TextField
              id="profile-phone-input"
              label={verifiedPhone ? 'New mobile number' : 'Mobile number'}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="01712345678"
              maxLength={16}
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value)
                setNotice(null)
              }}
              onBlur={() => setTouched(true)}
              hint={
                sameAsVerified
                  ? 'This number is already verified.'
                  : '11 digits, starting with 013 to 019.'
              }
              error={touched && phoneInput ? phoneError : ''}
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="dark" disabled={!canSend}>
                {busy === 'sending' ? 'Sending…' : 'Send code'}
              </Button>
              {verifiedPhone && (
                <Button variant="outline" onClick={cancel} disabled={Boolean(busy)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify} noValidate className="flex flex-col gap-4">
            <FormNotice tone="info">
              {`We sent a 6-digit code to ${sentTo}. This is a demo, so nothing is sent: use ${DEMO_OTP}.`}
            </FormNotice>
            <div className="flex flex-col gap-2">
              <p id="profile-otp-label" className="font-body text-sm font-semibold text-navy">
                Verification code
              </p>
              <OtpInput
                digits={digits}
                onChange={(next) => {
                  setDigits(next)
                  setNotice(null)
                }}
                disabled={locked || busy === 'verifying'}
                invalid={notice?.tone === 'error'}
                shake={shake}
                firstRef={firstBoxRef}
                labelId="profile-otp-label"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="dark" disabled={!canVerify}>
                {busy === 'verifying' ? 'Checking…' : 'Verify'}
              </Button>
              <Button
                variant="outline"
                onClick={() => sendCode(sentTo)}
                disabled={secondsLeft > 0 || Boolean(busy)}
              >
                {secondsLeft > 0 && (
                  <CountdownRing secondsLeft={secondsLeft} total={OTP_RESEND_SECONDS} />
                )}
                {busy === 'sending' ? 'Sending…' : resendLabel}
              </Button>
              <button
                type="button"
                onClick={startEdit}
                disabled={Boolean(busy)}
                className="rounded-full px-2 py-1 font-body text-sm font-semibold text-forest underline-offset-2 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              >
                Use a different number
              </button>
            </div>
          </form>
        )}

        <FormNotice tone={notice?.tone}>{notice?.text}</FormNotice>
      </div>
    </ProfileCard>
  )
}
