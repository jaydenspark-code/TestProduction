import React from 'react';
import ReactDOM from 'react-dom/client';

// Minimal EarnPro App without problematic imports
const EarnProApp = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
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
            <a href="#" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>Login</a>
            <a href="#" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }}>Register</a>
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
          <button style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            Start Earning Now
          </button>
          <button style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            👑 Join Agent Program
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

      {/* CTA Section */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Start Earning?</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.8 }}>Join millions of users building their financial future with EarnPro</p>
        <button style={{
          padding: '1.5rem 3rem',
          fontSize: '1.2rem',
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease'
        }}>
          Create Free Account
        </button>
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

console.log('🚀 Starting Clean EarnPro Application...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(<EarnProApp />);
console.log('✅ Clean EarnPro Application rendered successfully!');
