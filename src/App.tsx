import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/Layout/LoadingSpinner';
import { AgentApplicationProvider } from './context/AgentApplicationContext';
import { AdvertiserApplicationProvider } from './context/AdvertiserApplicationContext';
import { supabase } from './lib/supabaseClient';

// Direct imports - NO LAZY LOADING
import HomePage from './components/Home/HomePage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './pages/auth/verify-email';
import PaymentSetup from './components/Payment/PaymentSetup';
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
import AdvertiserPortal from './components/Advertiser/AdvertiserPortal';
import AdvertiserApplication from './components/Advertiser/AdvertiserApplication';
import LegalPortal from './components/Legal/LegalPortal';
import ChatBot from './components/AI/ChatBot';
import UserProfile from './components/Profile/UserProfile';
import BusinessPortal from './components/Advertiser/BusinessPortal';
import AdminPanel from './components/Admin/AdminPanel';
import TwoFactorAuth from './components/Auth/TwoFactorAuth';
import AuthCallback from './pages/AuthCallback';
import PaymentSuccess from './components/Payment/PaymentSuccess';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AgentApplicationProvider>
            <AdvertiserApplicationProvider>
              <Router>
            <div className="App">
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
                <ProtectedRoute requiresPaid>
                  <WithdrawalSystem />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute requiresPaid>
                  <TasksPage />
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
                  <AdvertiserPortal />
                </ProtectedRoute>
              } />
              <Route path="/legal" element={<LegalPortal />} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
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
