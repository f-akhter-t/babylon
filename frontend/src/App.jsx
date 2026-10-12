import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import Map from './pages/Map/Map'
import IssueDetail from './pages/IssueDetail/IssueDetail'
import IssueEdit from './pages/IssueEdit/IssueEdit'
import Report from './pages/Report/Report'
import Feed from './pages/Feed/Feed'
import Alerts from './pages/Alerts/Alerts'
import Profile from './pages/Profile/Profile'
import DepartmentPanel from './pages/DepartmentPanel/DepartmentPanel'
import VerifyResolutions from './pages/VerifyResolutions/VerifyResolutions'
import Accountability from './pages/Accountability/Accountability'
import IdentityReview from './pages/IdentityReview/IdentityReview'
import Styleguide from './pages/Styleguide/Styleguide'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<Map />} />
      <Route path="/issues/:id" element={<IssueDetail />} />
      <Route path="/issues/:id/edit" element={<IssueEdit />} />
      <Route path="/report" element={<Report />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/my-reports" element={<Alerts />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/department" element={<DepartmentPanel />} />
      <Route path="/admin/verify" element={<VerifyResolutions />} />
      <Route path="/admin/accountability" element={<Accountability />} />
      <Route path="/admin/identity" element={<IdentityReview />} />
      <Route path="/styleguide" element={<Styleguide />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}