import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from './ProfileCard'
import TextField from './TextField'
import FormNotice from './FormNotice'
import VerifyBadge from './VerifyBadge'
import { DEMO_OTP, requestOtp, verifyOtp } from '../../services/api'
import { checkPhone, normalizePhone } from '../../utils/profileRules'

// step: 'view' (a verified number), 'edit' (typing a number), 'code' (waiting for the code)
export default function PhoneCard({ profile, onDirtyChange }) {
  const [step, setStep] = useState(profile.phone ? 'view' : 'edit')
  const [phoneInput, setPhoneInput] = useState('')
  const [touched, setTouched] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(0)
  const [code, setCode] = useState('')
  const [locked, setLocked] = useState(false)
  const [busy, setBusy] = useState('') // '' | 'sending' | 'verifying'
  const [notice, setNotice] = useState(null) // { tone, text }
  // The number just verified, shown until the profile reloads with it.
  const [justVerified, setJustVerified] = useState('')
  const verifiedPhone = justVerified || profile.phone

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

  async function sendCode(number) {
    setBusy('sending')
    setNotice(null)
    try {
      const result = await requestOtp(profile.email, number)
      const sentAt = Date.now()
      setSentTo(result.phone)
      setNow(sentAt)
      setResendAt(sentAt + result.resendIn * 1000)
      setCode('')
      setLocked(false)
      setStep('code')
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
        setNotice({ tone: 'success', text: 'Your mobile number is verified.' })
      } else if (result.status === 'wrong') {
        setCode('')
        setNotice({
          tone: 'error',
          text:
            result.attemptsLeft === 1
              ? 'That code is not right. You have 1 try left.'
              : `That code is not right. You have ${result.attemptsLeft} tries left.`,
        })
      } else if (result.status === 'locked') {
        setLocked(true)
        setCode('')
        setNotice({ tone: 'error', text: 'Too many wrong codes. Ask for a new code to try again.' })
      } else {
        setLocked(true)
        setNotice({ tone: 'error', text: 'This code has expired. Ask for a new code.' })
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
    setCode('')
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
            <div>
              <p className="font-body text-xs text-muted">Verified number</p>
              <p className="font-body text-base font-bold tracking-wide text-navy">
                {verifiedPhone}
              </p>
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
            <TextField
              id="profile-otp"
              label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 digits"
              maxLength={6}
              value={code}
              disabled={locked}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''))
                setNotice(null)
              }}
              className="sm:max-w-[12rem]"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="dark" disabled={!canVerify}>
                {busy === 'verifying' ? 'Checking…' : 'Verify'}
              </Button>
              <Button
                variant="outline"
                onClick={() => sendCode(sentTo)}
                disabled={secondsLeft > 0 || Boolean(busy)}
              >
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
