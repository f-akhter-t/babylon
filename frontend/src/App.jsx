import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/layout/ErrorBoundary'
import PageLoading from './components/layout/PageLoading'
import ScrollToTop from './components/layout/ScrollToTop'
import RouteFade from './components/ui/RouteFade'
import OnboardingGate from './components/layout/OnboardingGate'
import Toaster from './components/ui/Toaster'

// Each page's code loads only when someone opens it.
const Home = lazy(() => import('./pages/Home/Home'))
const Map = lazy(() => import('./pages/Map/Map'))
const IssueDetail = lazy(() => import('./pages/IssueDetail/IssueDetail'))
const IssueEdit = lazy(() => import('./pages/IssueEdit/IssueEdit'))
const Report = lazy(() => import('./pages/Report/Report'))
const Feed = lazy(() => import('./pages/Feed/Feed'))
const MyReports = lazy(() => import('./pages/Myreports/MyReports'))
const Profile = lazy(() => import('./pages/Profile/Profile'))
const DepartmentPanel = lazy(() => import('./pages/DepartmentPanel/DepartmentPanel'))
const VerifyResolutions = lazy(() => import('./pages/VerifyResolutions/VerifyResolutions'))
const Accountability = lazy(() => import('./pages/Accountability/Accountability'))
const IdentityReview = lazy(() => import('./pages/IdentityReview/IdentityReview'))
const StaffProfile = lazy(() => import('./pages/StaffProfile/StaffProfile'))
const Login = lazy(() => import('./pages/Auth/Login'))
const Signup = lazy(() => import('./pages/Auth/Signup'))
const StaffLogin = lazy(() => import('./pages/Auth/StaffLogin'))
const StaffSignup = lazy(() => import('./pages/Auth/StaffSignup'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))
// The styleguide is a dev tool: production builds leave it out entirely,
// so there /styleguide shows the Page not found page.
const Styleguide = import.meta.env.DEV
  ? lazy(() => import('./pages/Styleguide/Styleguide'))
  : null

export default function App() {
  const { pathname } = useLocation()

  return (
    <>
      <ScrollToTop />
      <RouteFade />
      <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<PageLoading />}>
          {/* Staff who have not finished their profile can open only that page. */}
          <OnboardingGate>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<Map />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
              <Route path="/issues/:id/edit" element={<IssueEdit />} />
              <Route path="/report" element={<Report />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/my-reports" element={<MyReports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/department" element={<DepartmentPanel />} />
              <Route path="/admin/verify" element={<VerifyResolutions />} />
              <Route path="/admin/accountability" element={<Accountability />} />
              <Route path="/admin/identity" element={<IdentityReview />} />
              <Route path="/department/profile" element={<StaffProfile role="department" />} />
              <Route path="/admin/profile" element={<StaffProfile role="admin" />} />
              {Styleguide && <Route path="/styleguide" element={<Styleguide />} />}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff/signup" element={<StaffSignup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OnboardingGate>
        </Suspense>
      </ErrorBoundary>
      {/* Outside the boundary and Suspense, so toasts survive a page change or a crash. */}
      <Toaster />
    </>
  )
}
