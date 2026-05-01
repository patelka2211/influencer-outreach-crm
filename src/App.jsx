import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import BrandDashboard from './pages/BrandDashboard'
import Influencers from './pages/Influencers'
import InfluencerProfile from './pages/InfluencerProfile'
import EditInfluencer from './pages/EditInfluencer'
import Campaigns from './pages/Campaigns'
import CampaignProfile from './pages/CampaignProfile'
import EditCampaign from './pages/EditCampaign'
import Pipeline from './pages/Pipeline'
import AdminDashboard from './pages/AdminDashboard'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <BrandDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/influencers"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <Influencers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/influencers/:id"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <InfluencerProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/influencers/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <EditInfluencer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <Campaigns />
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <EditCampaign />
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns/:id"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <CampaignProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pipeline"
              element={
                <ProtectedRoute allowedRoles={['BRAND_MANAGER']}>
                  <Pipeline />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App