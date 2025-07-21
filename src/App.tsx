import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './components/Home/HomePage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import EmailVerification from './components/Auth/EmailVerification';
import PaymentSetup from './components/Payment/PaymentSetup';
import UserDashboard from './components/Dashboard/UserDashboard';

import AgentApplication from './components/Agent/AgentApplication';
// Change this line from:
// import AdvertiserPortal from './components/Dashboard/AdvertiserPortal';
// To:
import AdvertiserPortal from './components/Advertiser/AdvertiserPortal';
import AdvertiserApplication from './components/Advertiser/AdvertiserApplication';
import TasksPage from './components/Tasks/TasksPage';
import LegalPortal from './components/Legal/LegalPortal';
import ChatBot from './components/AI/ChatBot';
import ProtectedRoute from './components/ProtectedRoute';
import TelegramTask from './components/Tasks/TelegramTask';
import VideoPlayer from './components/Tasks/VideoPlayer';
import UserProfile from './components/Profile/UserProfile';
import BusinessPortal from './components/Advertiser/BusinessPortal';
import AdminPanel from './components/Admin/AdminPanel';
import TwoFactorAuth from './components/Auth/TwoFactorAuth';
import WithdrawalSystem from './components/Payment/WithdrawalSystem';
import { AgentApplicationProvider } from './context/AgentApplicationContext';
import { AdvertiserApplicationProvider } from './context/AdvertiserApplicationContext';
import { supabase } from './lib/supabaseClient';
import AuthCallback from './pages/auth/callback';
import PaymentSuccess from './components/Payment/PaymentSuccess';

// Add MagicLinkHandler component inside App.tsx
const MagicLinkHandler: React.FC = () => {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleMagicLink = async () => {
      // Check if we have an access token in the URL hash
      if (window.location.hash.includes('access_token')) {
        console.log('🔗 Magic link detected, processing...');
        console.log('Current URL:', window.location.href);

        try {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

          if (error) {
            console.error('❌ Error exchanging code for session:', error);
            // Redirect to login if there's an error
            window.location.replace('/login?error=magic_link_failed');
            return;
          }

          if (data?.session) {
            console.log('✅ Session established from magic link');
            
            // Update verification status
            const { error: updateError } = await supabase
              .from('users')
              .update({ is_verified: true })
              .eq('id', data.session.user.id);

            await refreshUser();
            
            // Clear URL hash
            window.history.replaceState(null, '', window.location.pathname);
            
            // Redirect to payment page
            window.location.replace('/payment');
          } else {
            console.error('❌ No session data received from exchangeCodeForSession');
            window.location.replace('/login?error=no_session');
          }
        } catch (err) {
          console.error('❌ Unexpected error in magic link handler:', err);
          window.location.replace('/login?error=unexpected_error');
        }
      } else {
        console.log('ℹ️ No magic link detected in URL');
      }
    };

    handleMagicLink();
  }, [refreshUser]);

  return null;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AgentApplicationProvider>
          <AdvertiserApplicationProvider>
            {/* Magic link handler must be inside AuthProvider context */}
            <MagicLinkHandler />
            <Router>
              <div className="min-h-screen">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<EmailVerification />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/verify-2fa" element={<TwoFactorAuth />} />

                    {/* Protected routes */}

                    <Route
                      path="/payment"
                      element={
                        <ProtectedRoute>
                          <PaymentSetup />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/withdraw"
                      element={
                        <ProtectedRoute requiresPaid>
                          <WithdrawalSystem />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute requiresPaid>
                          <UserDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tasks"
                      element={
                        <ProtectedRoute requiresPaid>
                          <TasksPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agent"
                      element={
                        <ProtectedRoute requiresPaid>
                          <AgentApplication />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/advertise"
                      element={
                        <ProtectedRoute requiresPaid>
                          <AdvertiserApplication />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/advertiser/portal"
                      element={
                        <ProtectedRoute requiresPaid allowedRoles={['advertiser']}>
                          <AdvertiserPortal />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/legal"
                      element={<LegalPortal />}
                    />

                    <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/business-portal" element={<BusinessPortal />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requiresPaid allowedRoles={['admin', 'superadmin']}>
                          <AdminPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/verify" element={<PaymentSuccess />} />
                  </Routes>
                </main>
                <Footer />
                <ChatBot />
                <div className="fixed bottom-24 right-6 z-50">
                  {/* <NotificationCenter /> */}
                </div>
              </div>
            </Router>
          </AdvertiserApplicationProvider>
        </AgentApplicationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;




