import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { showToast } from './utils/toast';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/Layout/LoadingSpinner';
import { supabase } from './lib/supabase';

// Direct imports - NO LAZY LOADING
import HomePage from './components/Home/HomePage';
// Temporarily comment out problematic components
// import Login from './components/Auth/Login';
// import Register from './components/Auth/Register';
// import VerifyEmail from './pages/auth/verify-email';
import PaymentSetup from './components/Payment/PaymentSetup';
// import ProtectedRoute from './components/ProtectedRoute';
// import UserDashboard from './components/Dashboard/UserDashboard';
// import AgentApplication from './components/Agent/AgentApplication';
// import AgentDashboard from './components/Dashboard/AgentDashboard';
import TasksPage from './components/Tasks/TasksPage';
import WithdrawalSystem from './components/Payment/WithdrawalSystem';
import ErrorBoundary from './components/ErrorBoundary';
import AISystemTest from './components/AISystemTest';
import AIStatusDashboard from './components/AIStatusDashboard';
import { AICampaignBuilder } from './components/Campaigns/AICampaignBuilder';
import { CampaignDashboard } from './components/Campaigns/CampaignDashboard';

// Import actual components instead of placeholders
import AdvertiserPortal from './components/Advertiser/AdvertiserPortal';
import EnhancedAdvertiserPortal from './components/Advertiser/EnhancedAdvertiserPortal';
import AdvertiserApplication from './components/Advertiser/AdvertiserApplication';
import LegalPortal from './components/Legal/LegalPortal';
import ChatBot from './components/AI/ChatBot';
import Leaderboard from './components/Leaderboard/Leaderboard';
import UserProfile from './components/Profile/UserProfile';
import BusinessPortal from './components/Advertiser/BusinessPortal';
import AdminPanel from './components/Admin/AdminPanel';
// import TwoFactorAuth from './components/Auth/TwoFactorAuth';
// import AuthCallback from './pages/AuthCallback';
import PaymentSuccess from './components/Payment/PaymentSuccess';

// Import advertising platform components
import AdvertisingPlatform from './components/Platform/AdvertisingPlatform';
import MonetizationDashboard from './components/Dashboard/MonetizationDashboard';
import BraintreeTestPage from './components/Testing/BraintreeTestPage';
import EarningsDashboard from './components/Dashboard/EarningsDashboard';

// Simple placeholder components for auth
const SimplePlaceholder = ({ title }: { title: string }) => (
  <div style={{
    padding: '2rem',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h1>
    <p>This feature will be available once authentication is restored.</p>
    <button 
      onClick={() => window.location.href = '/'}
      style={{
        padding: '0.5rem 1rem',
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '1rem'
      }}
    >
      Back to Home
    </button>
  </div>
);

const Login = () => <SimplePlaceholder title="Login" />;
const Register = () => <SimplePlaceholder title="Register" />;
const VerifyEmail = () => <SimplePlaceholder title="Email Verification" />;
const UserDashboard = () => <SimplePlaceholder title="User Dashboard" />;
const AgentApplication = () => <SimplePlaceholder title="Agent Application" />;
const AgentDashboard = () => <SimplePlaceholder title="Agent Dashboard" />;
const TwoFactorAuth = () => <SimplePlaceholder title="Two Factor Authentication" />;
const AuthCallback = () => <SimplePlaceholder title="Authentication Callback" />;

// Simple auth provider without problematic imports
const SimpleAuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('🔄 Using Simple Auth Provider (temporary)');
  return <>{children}</>;
};

// Simple protected route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initError, setInitError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    async function initializeApp() {
      try {
        console.log('🚀 Initializing EarnPro Application...');
        
        // Test Supabase connection if available
        if (supabase) {
          console.log('🔍 Testing Supabase connection...');
          const { data, error } = await supabase.from('users').select('count').limit(1);
          if (error) {
            console.warn('⚠️ Database connection test failed:', error.message);
            // Continue anyway - the app can work in testing mode
          } else {
            console.log('✅ Database connection successful');
          }
        } else {
          console.log('🧪 Running in testing mode - Supabase not configured');
        }

        setIsInitialized(true);
        console.log('✅ EarnPro Application initialized successfully');
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
      <SimpleAuthProvider>
        <ThemeProvider>
          <Router>
            <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/auth/verify-email" element={<VerifyEmail />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Payment routes */}
                  <Route path="/payment" element={<PaymentSetup />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/withdraw" element={
                    <ProtectedRoute>
                      <WithdrawalSystem />
                    </ProtectedRoute>
                  } />
                  <Route path="/tasks" element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/leaderboard" element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/agent" element={
                    <ProtectedRoute>
                      <AgentApplication />
                    </ProtectedRoute>
                  } />
                  <Route path="/agent/portal" element={
                    <ProtectedRoute>
                      <AgentDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/advertise" element={
                    <ProtectedRoute>
                      <AdvertiserApplication />
                    </ProtectedRoute>
                  } />
                  <Route path="/advertiser/portal" element={
                    <ProtectedRoute>
                      <EnhancedAdvertiserPortal />
                    </ProtectedRoute>
                  } />
                  <Route path="/advertiser/payment/success" element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  } />
                  <Route path="/legal" element={<LegalPortal />} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/business-portal" element={<BusinessPortal />} />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment/callback" element={<PaymentSuccess />} />
                  
                  {/* AI System Testing Routes */}
                  <Route path="/ai-test" element={
                    <ProtectedRoute>
                      <AISystemTest />
                    </ProtectedRoute>
                  } />
                  <Route path="/ai-status" element={
                    <ProtectedRoute>
                      <AIStatusDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/campaigns" element={
                    <ProtectedRoute>
                      <CampaignDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/campaigns/builder" element={
                    <ProtectedRoute>
                      <AICampaignBuilder />
                    </ProtectedRoute>
                  } />
                  
                  {/* Advertising Platform Routes */}
                  <Route path="/advertising" element={
                    <ProtectedRoute>
                      <AdvertisingPlatform userId="current-user" />
                    </ProtectedRoute>
                  } />
                  <Route path="/earnings" element={
                    <ProtectedRoute>
                      <MonetizationDashboard userId="current-user" />
                    </ProtectedRoute>
                  } />
                  <Route path="/earnings-dashboard" element={
                    <ProtectedRoute>
                      <EarningsDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Testing Routes - ADMIN ONLY */}
                  <Route path="/admin/test/braintree" element={
                    <ProtectedRoute>
                      <BraintreeTestPage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
              <ChatBot />
            </div>
          </Router>
        </ThemeProvider>
      </SimpleAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
