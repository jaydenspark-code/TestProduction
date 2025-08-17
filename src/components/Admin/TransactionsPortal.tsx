import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, CreditCard, Wallet, ArrowDownCircle, ArrowUpCircle, Clock, AlertTriangle, CheckCircle, Send, Shield } from 'lucide-react';
import WithdrawalSummarySection from './WithdrawalSummarySection';
import BatchPayoutProcessor from './BatchPayoutProcessor';
interface Transaction {
  id: string;
  user_email: string;
  country: string;
  amount: number;
  payment_method: 'stripe' | 'paypal' | 'paystack';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

const MOCK_DEPOSITS: Transaction[] = [
  {
    id: 'dep_1',
    user_email: 'ijaydenspark@gmail.com',
    country: 'US',
    amount: 50.00,
    payment_method: 'stripe',
    status: 'completed',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'dep_2',
    user_email: 'princeedie142@gmail.com',
    country: 'US',
    amount: 100.00,
    payment_method: 'paypal',
    status: 'completed',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'dep_3',
    user_email: 'noguyliketrey@gmail.com',
    country: 'US',
    amount: 75.00,
    payment_method: 'paystack',
    status: 'pending',
    created_at: new Date().toISOString()
  }
];

const MOCK_PAYOUTS: Transaction[] = [
  {
    id: 'pay_1',
    user_email: 'ijaydenspark@gmail.com',
    country: 'US',
    amount: 25.00,
    payment_method: 'paypal',
    status: 'completed',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pay_2',
    user_email: 'princeedie142@gmail.com',
    country: 'US',
    amount: 50.00,
    payment_method: 'paystack',
    status: 'pending',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];


const TransactionsPortal: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposits' | 'payouts'>('deposits');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme-based colors
  const colors = {
    background: theme === 'professional' ? 'bg-gray-800/50' : 'bg-white/10',
    card: theme === 'professional' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/10 border-white/20',
    cardInner: theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30' : 'bg-white/5 border-white/10',
    tabActive: theme === 'professional' ? 'bg-cyan-600' : 'bg-purple-600',
    tabInactive: theme === 'professional' ? 'text-white/70 hover:bg-gray-700' : 'text-white/70 hover:bg-white/10',
    buttonPrimary: theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700',
    textPrimary: 'text-white',
    textSecondary: 'text-white/70',
  };

  useEffect(() => {
    setLoading(true);
    // Update transactions when tab changes using mock data
    setTransactions(activeTab === 'deposits' ? MOCK_DEPOSITS : MOCK_PAYOUTS);
    setLoading(false);
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-amber-400';
      case 'failed':
        return 'text-red-400';
      default:
        return colors.textSecondary;
    }
  };

  const getPaymentMethodIcon = (method: 'stripe' | 'paypal' | 'paystack') => {
    switch (method) {
      case 'stripe':
        return <CreditCard className="h-4 w-4 text-blue-400" />;
      case 'paypal':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'paystack':
        return <Wallet className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPaymentMethodColor = (method: 'stripe' | 'paypal' | 'paystack') => {
    switch (method) {
      case 'stripe':
        return <CreditCard className="w-5 h-5" />;
      case 'paypal':
        return <DollarSign className="w-5 h-5" />;
      case 'paystack':
        return <Wallet className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${colors.card} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>Transactions</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'deposits' ? colors.tabActive : colors.tabInactive}`}
            >
              <div className="flex items-center space-x-2">
                <ArrowDownCircle className="w-4 h-4" />
                <span>Deposits</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'payouts' ? colors.tabActive : colors.tabInactive}`}
            >
              <div className="flex items-center space-x-2">
                <ArrowUpCircle className="w-4 h-4" />
                <span>Payouts</span>
              </div>
            </button>
          </div>
        </div>

        <div className={`${colors.cardInner} rounded-xl p-4`}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>User</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Country</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Amount</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Payment Method</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Status</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className={`${colors.textPrimary} py-3 px-4`}>{transaction.user_email}</td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>{transaction.country}</td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(transaction.payment_method)}
                          <span>{transaction.payment_method}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4`}>
                        <span className={`${getStatusColor(transaction.status)} font-medium`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Render WithdrawalSummarySection only when payouts tab is active */}
      {activeTab === 'payouts' && <WithdrawalSummarySection />}
      
      {/* Batch Payout Processor - only show for payouts tab */}
      {activeTab === 'payouts' && <BatchPayoutProcessor />}
    </div>
  );
};

export default TransactionsPortal;
