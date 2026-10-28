import { Component } from 'react'
import Logo from './Logo'
import Tr from '../../i18n/Tr'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from '../ui/ThemeToggle'

// Catches a crash in any page, including a page whose code failed to load, and
// shows a calm screen instead of a blank one. No Navbar or Footer here: they
// might be what broke. resetKey (the path) clears the error when the person
// goes to another page.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('A page crashed.', error, info.componentStack)
  }

  componentDidUpdate(previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="relative grid min-h-dvh place-items-center bg-page px-4 py-10 font-body">
        {/* The language and theme buttons stay available even on this screen. */}
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-ink p-1.5">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div role="alert" className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <Logo to={null} size="lg" tone="onLight" />
          <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
            <Tr>Something went wrong on this page.</Tr>
          </h1>
          <p className="text-base text-soft">
            <Tr>Reloading usually fixes it. If it does not, start again from the home page.</Tr>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-full bg-ink px-6 py-3 text-base font-bold text-frost transition-opacity hover:opacity-90 motion-reduce:transition-none"
            >
              <Tr>Reload</Tr>
            </button>
            {/* A full page load, so a broken page's code is fetched again. */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border-2 border-navy px-6 py-3 text-base font-bold text-navy transition-colors hover:bg-ink/10 motion-reduce:transition-none"
            >
              <Tr>Go home</Tr>
            </a>
          </div>
        </div>
      </main>
    )
  }
}
