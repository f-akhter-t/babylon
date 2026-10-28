import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from './ProfileCard'
import FormNotice from './FormNotice'
import VerifyBadge from './VerifyBadge'
import OtpInput from './OtpInput'
import CountdownRing from './CountdownRing'
import { requestEmailCode, verifyEmailCode } from '../../services/api'
import { useT } from '../../i18n/useLanguage'

const CODE_LENGTH = 6
const emptyCode = () => Array.from({ length: CODE_LENGTH }, () => '')

// Staff and citizens: proves the account's email address is a real mailbox the
// person can read. The code is always sent to the address the account signed
// up with, so there is nothing to type except the code itself. For a citizen it
// is optional and never blocks anything; for staff the setup waits for it.
//   ask   -> a button that sends the code
//   code  -> six boxes, Verify and a resend button with a countdown
//   done  -> the verified address (also shown at once for an already verified account)
// note: an optional line shown above the button (used for an account whose setup
// was finished before this check existed).
export default function EmailCard({ profile, onDirtyChange, announce, note }) {
  const t = useT()
  const [step, setStep] = useState('ask') // 'ask' | 'code'
  const [digits, setDigits] = useState(emptyCode)
  const [shake, setShake] = useState(0)
  const [locked, setLocked] = useState(false)
  const [busy, setBusy] = useState('') // '' | 'sending' | 'verifying'
  const [notice, setNotice] = useState(null) // { tone, text }
  const [resendAt, setResendAt] = useState(0)
  const [resendTotal, setResendTotal] = useState(30)
  const [now, setNow] = useState(0)
  // Shown as verified at once, before the profile reloads with it.
  const [justVerified, setJustVerified] = useState(false)
  const verified = profile.emailVerified || justVerified
  // Where focus should go after the step changes: { target, n }
  const [focusRequest, setFocusRequest] = useState(null)
  const firstBoxRef = useRef(null)
  const verifiedRef = useRef(null)

  const code = digits.join('')
  const canVerify = /^\d{6}$/.test(code) && !locked && !busy
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000))

  const dirty = !verified && step === 'code' && digits.some(Boolean)
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

  function markVerified() {
    const text = 'Your email address is verified.'
    setJustVerified(true)
    setNotice(null)
    announce(t(text), { toast: true })
    setFocusRequest({ target: 'verified', n: Date.now() })
  }

  async function sendCode() {
    setBusy('sending')
    setNotice(null)
    try {
      const result = await requestEmailCode()
      if (result.status === 'verified') {
        markVerified()
        return
      }
      const sentAt = Date.now()
      setNow(sentAt)
      setResendTotal(result.resendIn)
      setResendAt(sentAt + result.resendIn * 1000)
      setDigits(emptyCode())
      setLocked(false)
      setStep('code')
      setFocusRequest({ target: 'code', n: sentAt })
      announce(t('We sent a 6-digit code to {to}. Type it in the boxes.', { to: result.email }))
    } catch (err) {
      setNotice({ tone: 'error', text: err.message || 'We could not send a code. Please try again.' })
    } finally {
      setBusy('')
    }
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
      const result = await verifyEmailCode(code)
      if (result.status === 'verified') markVerified()
      else wrongCode(result.message, result.status === 'locked')
    } catch (err) {
      setNotice({ tone: 'error', text: err.message || 'We could not check the code. Please try again.' })
    } finally {
      setBusy('')
    }
  }

  const sendLine = t('We will send a {n}-digit code to {to}.', { n: CODE_LENGTH, to: '\u0000' }).split('\u0000')

  const resendLabel =
    secondsLeft > 0
      ? t('Resend code in 0:{ss}', { ss: String(secondsLeft).padStart(2, '0') })
      : t('Resend code')

  return (
    <ProfileCard
      id="profile-email"
      title={t('Email verification')}
      intro={t('We check that this address is yours with a one-time code.')}
      badge={<VerifyBadge status={verified ? 'verified' : 'not-verified'} />}
    >
      <div className="flex flex-col gap-4">
        {verified && (
          <div
            ref={verifiedRef}
            tabIndex={-1}
            className="rounded-tile bg-white/70 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <p className="font-body text-xs text-muted">{t('Verified email address')}</p>
            <p className="font-body text-base font-bold break-all text-navy">{profile.email}</p>
          </div>
        )}

        {!verified && step === 'ask' && (
          <div className="flex flex-col gap-3">
            {note && <p className="font-body text-sm font-semibold text-navy">{t(note)}</p>}
            <p className="font-body text-sm text-navy">
              {sendLine[0]}
              <span className="font-bold break-all">{profile.email}</span>
              {sendLine[1]}
            </p>
            <div>
              <Button variant="dark" onClick={sendCode} disabled={Boolean(busy)}>
                {busy === 'sending' ? t('Sending…') : t('Send code')}
              </Button>
            </div>
          </div>
        )}

        {!verified && step === 'code' && (
          <form onSubmit={handleVerify} noValidate className="flex flex-col gap-4">
            <FormNotice tone="info">
              {t('We sent a {n}-digit code to {to}. It can take a minute to arrive, so check your spam folder too.', { n: CODE_LENGTH, to: profile.email })}
            </FormNotice>
            <div className="flex flex-col gap-2">
              <p id="email-otp-label" className="font-body text-sm font-semibold text-navy">
                {t('Verification code')}
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
                labelId="email-otp-label"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="dark" disabled={!canVerify}>
                {busy === 'verifying' ? t('Checking…') : t('Verify')}
              </Button>
              <Button variant="outline" onClick={sendCode} disabled={secondsLeft > 0 || Boolean(busy)}>
                {secondsLeft > 0 && <CountdownRing secondsLeft={secondsLeft} total={resendTotal} />}
                {busy === 'sending' ? t('Sending…') : resendLabel}
              </Button>
            </div>
          </form>
        )}

        <FormNotice tone={notice?.tone}>{notice?.text}</FormNotice>
      </div>
    </ProfileCard>
  )
}
