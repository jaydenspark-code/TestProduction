import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, History, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'bonus' | 'commission';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    description: string;
    created_at: string;
}

interface WalletData {
    balance: number;
    currency: string;
}

const Wallet: React.FC = () => {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [showWithdrawForm, setShowWithdrawForm] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({
        bank_code: '',
        account_number: '',
        account_name: ''
    });
    const [error, setError] = useState('');
    const { user } = useAuth();
    const { theme } = useTheme();

    useEffect(() => {
        if (user) {
            loadWalletData();
            loadTransactions();
        }
    }, [user]);

    const loadWalletData = async () => {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .select('balance, currency')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Error loading wallet:', error);
                return;
            }

            setWallet(data || { balance: 0, currency: 'NGN' });
        } catch (err) {
            console.error('Error loading wallet:', err);
        }
    };

    const loadTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error loading transactions:', error);
                return;
            }

            setTransactions(data || []);
        } catch (err) {
            console.error('Error loading transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setWithdrawLoading(true);
        setError('');

        if (!user) {
            setError('User not found');
            setWithdrawLoading(false);
            return;
        }

        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount');
            setWithdrawLoading(false);
            return;
        }

        if (wallet && amount > wallet.balance) {
            setError('Insufficient balance');
            setWithdrawLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    amount,
                    user_id: user.id,
                    ...bankDetails
                })
            });

            const result = await response.json();

            if (result.success) {
                setError('');
                setShowWithdrawForm(false);
                setWithdrawAmount('');
                setBankDetails({ bank_code: '', account_number: '', account_name: '' });
                // Reload wallet data
                await loadWalletData();
                await loadTransactions();
            } else {
                setError(result.error || 'Withdrawal failed');
            }
        } catch (err) {
            console.error('Withdrawal error:', err);
            setError('Withdrawal failed. Please try again.');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return <Plus className="w-4 h-4 text-green-500" />;
            case 'withdrawal':
                return <Minus className="w-4 h-4 text-red-500" />;
            case 'bonus':
                return <TrendingUp className="w-4 h-4 text-blue-500" />;
            case 'commission':
                return <TrendingUp className="w-4 h-4 text-purple-500" />;
            default:
                return <History className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-500';
            case 'pending':
                return 'text-yellow-500';
            case 'failed':
                return 'text-red-500';
            case 'cancelled':
                return 'text-gray-500';
            default:
                return 'text-gray-500';
        }
    };

    const bgClass = theme === 'professional'
        ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
        : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

    const cardClass = theme === 'professional'
        ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-gray-700/50'
        : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20';

    if (loading) {
        return (
            <div className={`${bgClass} flex items-center justify-center p-4`}>
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${bgClass} p-4`}>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Wallet Balance Card */}
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className={`w-12 h-12 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-xl flex items-center justify-center mr-4`}>
                                <WalletIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Wallet</h1>
                                <p className="text-white/70">Manage your earnings and withdrawals</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${theme === 'professional'
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                }`}
                        >
                            Withdraw
                        </button>
                    </div>

                    <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-xl p-6 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                        <div className="text-center">
                            <p className="text-white/70 text-sm mb-2">Available Balance</p>
                            <p className="text-4xl font-bold text-white mb-2">
                                {wallet ? formatCurrency(wallet.balance, wallet.currency) : '₦0.00'}
                            </p>
                            <p className="text-white/50 text-sm">
                                {wallet?.currency === 'NGN' ? 'Nigerian Naira' : wallet?.currency}
                            </p>
                        </div>
                    </div>

                    {/* Withdrawal Form */}
                    {showWithdrawForm && (
                        <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-xl p-6 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} mt-6`}>
                            <h3 className="text-white font-medium mb-4">Withdraw Funds</h3>
                            <form onSubmit={handleWithdraw} className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Amount (NGN)</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-lg border ${theme === 'professional'
                                                ? 'bg-gray-700/50 border-gray-600 text-white'
                                                : 'bg-white/10 border-white/20 text-white'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        placeholder="Enter amount"
                                        min="100"
                                        step="100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Bank Code</label>
                                    <input
                                        type="text"
                                        value={bankDetails.bank_code}
                                        onChange={(e) => setBankDetails({ ...bankDetails, bank_code: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${theme === 'professional'
                                                ? 'bg-gray-700/50 border-gray-600 text-white'
                                                : 'bg-white/10 border-white/20 text-white'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        placeholder="e.g., 044 for Access Bank"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        value={bankDetails.account_number}
                                        onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${theme === 'professional'
                                                ? 'bg-gray-700/50 border-gray-600 text-white'
                                                : 'bg-white/10 border-white/20 text-white'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        placeholder="10-digit account number"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Account Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.account_name}
                                        onChange={(e) => setBankDetails({ ...bankDetails, account_name: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${theme === 'professional'
                                                ? 'bg-gray-700/50 border-gray-600 text-white'
                                                : 'bg-white/10 border-white/20 text-white'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        placeholder="Account holder name"
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                                        {error}
                                    </div>
                                )}
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={withdrawLoading}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200 ${theme === 'professional'
                                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
                                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {withdrawLoading ? 'Processing...' : 'Withdraw'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowWithdrawForm(false)}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200 ${theme === 'professional'
                                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                                : 'bg-white/10 hover:bg-white/20 text-white'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div className={cardClass}>
                    <h2 className="text-xl font-bold text-white mb-6">Transaction History</h2>
                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8">
                                <History className="w-12 h-12 text-white/30 mx-auto mb-4" />
                                <p className="text-white/50">No transactions yet</p>
                            </div>
                        ) : (
                            transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getTransactionIcon(transaction.type)}
                                            <div className="ml-3">
                                                <p className="text-white font-medium capitalize">{transaction.type}</p>
                                                <p className="text-white/70 text-sm">{transaction.description}</p>
                                                <p className="text-white/50 text-xs">{formatDate(transaction.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${transaction.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'
                                                }`}>
                                                {transaction.type === 'withdrawal' ? '-' : '+'}
                                                {formatCurrency(transaction.amount, transaction.currency)}
                                            </p>
                                            <p className={`text-sm ${getStatusColor(transaction.status)}`}>
                                                {transaction.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Wallet; 