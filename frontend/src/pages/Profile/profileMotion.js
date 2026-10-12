// Motion for the Profile page. pageRise and formRise are the same entrances
// as the Report page. People who ask for less motion get the end state at
// once (see the media query here and the safety net in index.css).

export const profileStyle = `
  @keyframes pageRise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes formRise {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes barFill {
    from { width: 0; }
  }
  @keyframes stepGrow {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
  @keyframes badgePop {
    0% { transform: scale(0.7); }
    60% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }
  @keyframes checkDraw {
    from { stroke-dashoffset: 24; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes saveBarIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .profile-page *,
    .profile-page *::before,
    .profile-page *::after {
      animation-duration: 0.001ms !important;
      animation-delay: 0s !important;
      transition-duration: 0.001ms !important;
    }
  }
`

export const pageRise = (delay = 0) => ({ animation: `pageRise 0.5s ease-out ${delay}s both` })
export const formRise = (delay = 0) => ({ animation: `formRise 0.5s ease-out ${delay}s both` })

// A short left-right shake for a wrong code. Used with element.animate().
export const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(7px)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(3px)' },
  { transform: 'translateX(0)' },
]
