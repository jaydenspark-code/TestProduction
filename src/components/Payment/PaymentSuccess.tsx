import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (reference) {
      // Refresh user data to get updated payment status
      refreshUser().then(() => {
        setTimeout(() => navigate('/dashboard'), 2000);
      });
    }
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-300">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;