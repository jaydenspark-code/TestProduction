import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { showToast } from './utils/toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/Layout/LoadingSpinner';
import { AgentApplicationProvider } from './context/AgentApplicationContext';
import { AdvertiserApplicationProvider } from './context/AdvertiserApplicationContext';
import { supabase } from './lib/supabase';

// Direct imports - NO LAZY LOADING
import HomePage from './components/Home/HomePage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './pages/auth/verify-email';
import VerifyCode from './pages/auth/verify-code';
import PaymentSetup from './components/Payment/PaymentSetup';
import PaymentTestPage from './components/Payment/PaymentTestPage';
import ProtectedRoute from './components/ProtectedRoute';
import UserDashboard from './components/Dashboard/UserDashboard';
import AgentApplication from './components/Agent/AgentApplication';
import AgentDashboard from './components/Dashboard/AgentDashboard';
import TasksPage from './components/Tasks/TasksPage';
import WithdrawalSystem from './components/Payment/WithdrawalSystem';
import ErrorBoundary from './components/ErrorBoundary';
import AISystemTest from './components/AISystemTest';
import AIStatusDashboard from './components/AIStatusDashboard';
import { AICampaignBuilder } from './components/Campaigns/AICampaignBuilder';
import { CampaignDashboard } from './components/Campaigns/CampaignDashboard';

// Import actual components instead of placeholders
import EnhancedAdvertiserPortal from './components/Advertiser/EnhancedAdvertiserPortal';
import AdvertiserApplication from './components/Advertiser/AdvertiserApplication';
import LegalPortal from './components/Legal/LegalPortal';
import ChatBot from './components/AI/ChatBot';
import Leaderboard from './components/Leaderboard/Leaderboard';
import UserProfile from './components/Profile/UserProfile';
import BusinessPortal from './components/Advertiser/BusinessPortal';
import AdminPanel from './components/Admin/AdminPanel';
import AuthCallback from './pages/auth/callback';
import PaymentSuccess from './components/Payment/PaymentSuccess';

// Import advertising platform components
import AdvertisingPlatform from './components/Platform/AdvertisingPlatform';
import MonetizationDashboard from './components/Dashboard/MonetizationDashboard';
import BraintreeTestPage from './components/Testing/BraintreeTestPage';
import EarningsDashboard from './components/Dashboard/EarningsDashboard';
import PaymentRequired from './components/Auth/PaymentRequired';

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    async function initializeApp() {
      try {
        // Test Supabase connection if available
        if (supabase) {
          console.log('🔍 Testing Supabase connection...');
          const { error } = await supabase.from('users').select('count').limit(1);
          if (error) {
            console.warn('⚠️ Database connection test failed:', error.message);
            // Continue anyway - the app can work in testing mode
          } else {
            console.log('✅ Database connection successful');
          }
        } else {
          console.log('🧪 Running in testing mode - Supabase not configured');
        }

        // Initialize other services here if needed
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Don't set error for initialization issues - allow app to run in testing mode
        setIsInitialized(true);
      }
    }

    initializeApp();
  }, []);

  if (initError) {
    const errorMessage = initError.message || 'Failed to initialize application';
    showToast.error(errorMessage);
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Initialization Error</h2>
          <p className="text-gray-300 mb-4">{initError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Toaster />
      <AuthProvider>
        <ThemeProvider>
          <AgentApplicationProvider>
            <AdvertiserApplicationProvider>
              <Router>
                <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
              <Header />
              <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-code" element={<VerifyCode />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Payment routes */}
              <Route path="/payment" element={<PaymentSetup />} /> {/* RESTORED ORIGINAL */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment-required" element={<PaymentRequired />} />
              <Route path="/payment/test" element={<PaymentTestPage />} />
              
              {/* Protected routes - ALL REQUIRE PAYMENT (strict pay-to-access) */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiresPaid>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/withdraw" element={
                <ProtectedRoute requiresPaid>
                  <WithdrawalSystem />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute requiresPaid>
                  <TasksPage />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute allowUnpaidAccess>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/agent" element={
                <ProtectedRoute requiresPaid>
                  <AgentApplication />
                </ProtectedRoute>
              } />
              <Route path="/agent/portal" element={
                <ProtectedRoute requiresPaid allowedRoles={['agent']}>
                  <AgentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/advertise" element={
                <ProtectedRoute requiresPaid>
                  <AdvertiserApplication />
                </ProtectedRoute>
              } />
              <Route path="/advertiser/portal" element={
                <ProtectedRoute requiresPaid allowedRoles={['advertiser']}>
                  <EnhancedAdvertiserPortal />
                </ProtectedRoute>
              } />
              <Route path="/advertiser/payment/success" element={
                <ProtectedRoute requiresPaid allowedRoles={['advertiser']}>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              <Route path="/legal" element={<LegalPortal />} />
              <Route path="/profile" element={
                <ProtectedRoute requiresPaid>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/business-portal" element={<BusinessPortal />} />
              <Route path="/admin" element={
                <ProtectedRoute requiresPaid allowedRoles={['admin', 'superadmin']}>
                  <AdminPanel />
                </ProtectedRoute>
              } />
              <Route path="/payment/callback" element={<PaymentSuccess />} />
              
              {/* AI System Testing Routes */}
              <Route path="/ai-test" element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <AISystemTest />
                </ProtectedRoute>
              } />
              <Route path="/ai-status" element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <AIStatusDashboard />
                </ProtectedRoute>
              } />
              <Route path="/campaigns" element={
                <ProtectedRoute requiresPaid>
                  <CampaignDashboard />
                </ProtectedRoute>
              } />
              <Route path="/campaigns/builder" element={
                <ProtectedRoute requiresPaid>
                  <AICampaignBuilder />
                </ProtectedRoute>
              } />
              
              {/* Advertising Platform Routes */}
              <Route path="/advertising" element={
                <ProtectedRoute requiresPaid>
                  <AdvertisingPlatform />
                </ProtectedRoute>
              } />
              <Route path="/earnings" element={
                <ProtectedRoute requiresPaid>
                  <MonetizationDashboard userId="current-user" />
                </ProtectedRoute>
              } />
              <Route path="/earnings-dashboard" element={
                <ProtectedRoute requiresPaid>
                  <EarningsDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin Testing Routes - ADMIN ONLY */}
              <Route path="/admin/test/braintree" element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <BraintreeTestPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
          <ChatBot />
        </div>
              </Router>
            </AdvertiserApplicationProvider>
          </AgentApplicationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
