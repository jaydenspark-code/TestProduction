import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Ultra-minimal EarnPro App without ANY problematic imports
const EarnProApp = () => {
  const [currentPage, setCurrentPage] = React.useState('home');

  const navigate = (page: string) => {
    setCurrentPage(page);
    console.log('🔄 Navigation to:', page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {renderPage()}
    </div>
  );
};

// HomePage Component
const HomePage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            💰
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>EarnPro</h1>
          <nav style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => onNavigate('login')}
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px', 
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button 
              onClick={() => onNavigate('register')}
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px', 
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💰</div>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontWeight: 'bold' }}>
          Earn More with <span style={{ background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EarnPro</span>
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          Join the world's most trusted referral platform. Earn money by sharing with friends, building your network, and becoming an influencer agent.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onNavigate('register')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            Start Earning Now
          </button>
          <button 
            onClick={() => onNavigate('dashboard')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            👑 Agent Program
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '2rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          {[
            { number: '2M+', label: 'Active Users' },
            { number: '150+', label: 'Countries' },
            { number: '$50M+', label: 'Paid Out' },
            { number: '99.9%', label: 'Uptime' }
          ].map((stat, index) => (
            <div key={index}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{stat.number}</div>
              <div style={{ opacity: 0.8 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Why Choose EarnPro?</h2>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Everything you need to succeed in referral marketing</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {[
            { icon: '🌐', title: 'Global Network', description: 'Join millions of users earning through our worldwide referral network' },
            { icon: '💰', title: 'Multi-Level Earnings', description: 'Earn from direct referrals and up to 3 levels of indirect referrals' },
            { icon: '👑', title: 'Agent Program', description: 'Become an influencer agent and unlock exclusive earning opportunities' },
            { icon: '🔒', title: 'Secure Platform', description: 'Bank-level security with encrypted transactions and data protection' },
            { icon: '🌍', title: 'Multi-Currency Support', description: 'Local currency support across 15+ countries with real-time conversion' },
            { icon: '⚡', title: 'Instant Tracking', description: 'Real-time tracking of referrals, earnings, and network performance' }
          ].map((feature, index) => (
            <div key={index} style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 'bold' }}>{feature.title}</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        opacity: 0.8
      }}>
        <p>&copy; 2025 EarnPro. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Login Page
const LoginPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [formData, setFormData] = React.useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Login attempt:', formData.email);
    alert('Login functionality will be restored soon!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '3rem',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login to EarnPro</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your email"
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Login
          </button>
        </form>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [formData, setFormData] = React.useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Registration attempt:', formData.email);
    alert('Registration functionality will be restored soon!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '3rem',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Join EarnPro</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your full name"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your email"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Create a password"
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Confirm your password"
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Create Account
          </button>
        </form>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '3rem',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '2rem' }}>🚀 EarnPro Dashboard</h2>
        <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
          Your dashboard will be available once authentication is fully restored.
        </p>
        <div style={{ marginBottom: '2rem' }}>
          <h3>Coming Soon:</h3>
          <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
            <li>👥 Referral Management</li>
            <li>💰 Earnings Tracking</li>
            <li>📊 Analytics Dashboard</li>
            <li>👑 Agent Portal</li>
            <li>💳 Payment Setup</li>
            <li>🎯 Task Management</li>
          </ul>
        </div>
        <button
          onClick={() => onNavigate('home')}
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

console.log('🚀 Starting Ultra-Simple EarnPro...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(<EarnProApp />);
console.log('✅ Ultra-Simple EarnPro loaded successfully!');
