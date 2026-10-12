// How complete a profile is, for the completeness meter.
// state: 'done' | 'pending' | 'todo'
//   Details:  done once the name and the ward are filled in (address is optional).
//   Phone:    done once the number is verified.
//   Identity: done only when Verified. Pending review shows as 'pending'.
export function profileProgress(profile) {
  const identity = profile.identity.status
  const steps = [
    {
      key: 'details',
      label: 'Details',
      state: profile.name.trim() && profile.ward ? 'done' : 'todo',
    },
    { key: 'phone', label: 'Phone', state: profile.phoneVerified ? 'done' : 'todo' },
    {
      key: 'identity',
      label: 'Identity',
      state: identity === 'verified' ? 'done' : identity === 'pending' ? 'pending' : 'todo',
    },
  ]
  return { steps, done: steps.filter((step) => step.state === 'done').length }
}
