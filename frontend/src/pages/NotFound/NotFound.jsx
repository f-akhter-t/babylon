import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Logo from '../../components/layout/Logo'
import Button from '../../components/ui/Button'
import { homePathFor } from '../../services/auth'
import { useViewer } from '../Map/useViewer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

// Any address that is not a page. Staff also get a way back to their panel.
export default function NotFound() {
  useDocumentTitle('Page not found')
  const viewer = useViewer()
  const isStaff = viewer.role === 'department' || viewer.role === 'admin'

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-16 font-body">
        <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
          <Logo to={null} size="lg" tone="onLight" />
          <h1 className="font-heading text-4xl font-extrabold text-navy sm:text-5xl">
            Page not found
          </h1>
          <p className="text-lg text-slate">We can&apos;t find that page.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {isStaff && (
              <Button to={homePathFor(viewer.role)} variant="dark">
                Go to your panel
              </Button>
            )}
            <Button to="/map" variant={isStaff ? 'outline' : 'dark'}>
              Go to the map
            </Button>
            <Button to="/" variant="outline">
              Go to Home
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
