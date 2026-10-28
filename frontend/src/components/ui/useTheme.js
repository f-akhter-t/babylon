import { useCallback, useEffect, useState } from 'react'

const KEY = 'babylon-theme'

function current() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

// The theme lives on <html data-theme="dark">. index.html sets it before the
// first paint from the saved choice, so there is no flash of the light page.
// Light is the default; the choice is remembered on this device.
export function useTheme() {
  const [theme, setThemeState] = useState(current)

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeState(current()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const setTheme = useCallback((next) => {
    if (next === 'dark') document.documentElement.dataset.theme = 'dark'
    else delete document.documentElement.dataset.theme
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // private window or blocked storage: the choice just lasts for this visit
    }
  }, [])

  return { theme, setTheme, dark: theme === 'dark' }
}
