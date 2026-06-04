import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { NewConsortium } from './pages/NewConsortium'
import { Payments } from './pages/Payments'
import { NewPayment } from './pages/NewPayment'
import { ManageMembers } from './pages/ManageMembers'
import { Profile } from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/consorcio/novo"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewConsortium />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/consorcio/:id/membros"
            element={
              <ProtectedRoute>
                <Layout>
                  <ManageMembers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagamentos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Payments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagamentos/novo"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewPayment />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
