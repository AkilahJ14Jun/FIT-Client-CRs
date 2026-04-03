import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TranslationProvider } from './i18n/TranslationProvider';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerAreas } from './pages/CustomerAreas';
import { Sources } from './pages/Sources';
import { Entries } from './pages/Entries';
import { Dispatch } from './pages/Dispatch';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Architecture } from './pages/Architecture';
import { UserGuide } from './pages/UserGuide';
import { MobileAccess } from './pages/MobileAccess';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    // Database is managed by the backend (MySQL). No client-side seeding needed.
  }, []);

  return (
    <TranslationProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customer-areas" element={<CustomerAreas />} />
              <Route path="/sources" element={<Sources />} />
              <Route path="/entries" element={<Entries />} />
              <Route path="/dispatch" element={<Dispatch />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/guide" element={<UserGuide />} />
              <Route path="/mobile" element={<MobileAccess />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TranslationProvider>
  );
}
