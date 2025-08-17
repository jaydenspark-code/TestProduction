// Quick test to simulate user login and navigate to payment
window.localStorage.setItem('mockUser', JSON.stringify({
  id: 'test-user-123',
  email: 'demo@test.com',
  fullName: 'Demo User',
  isVerified: true,
  isPaidUser: false,
  role: 'user'
}));

console.log('Mock user set for testing payment flow');
