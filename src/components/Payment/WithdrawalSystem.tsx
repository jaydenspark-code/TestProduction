import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
    Wallet,
    CreditCard,
    Building2,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    Shield,
    Zap,
    TrendingUp
} from 'lucide-react';
import { DualCurrencyDisplay } from '../../utils/currency';
import { paystackService } from '../../services/paystackService';
import { emailService } from '../../services/emailService';
import { supabase } from '../../lib/supabaseClient';

interface WithdrawalMethod {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    minAmount: number;
    maxAmount: number;
    fee: number; // percent
    processingTime: string;
    description: string;
    isAvailable: boolean;
}

interface WithdrawalRequest {
    id: string;
    amount: number;
    method: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: Date;
    processedAt?: Date;
    fee: number;
    netAmount: number;
    reference: string;
}

const WithdrawalSystem: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'withdraw' | 'history' | 'security'>('withdraw');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);

    // Mock user balance and earnings
    const userBalance = 1247.5;
    const pendingEarnings = 89.25;
    const availableForWithdrawal = userBalance - pendingEarnings;

    // Withdrawal methods
    const withdrawalMethods: WithdrawalMethod[] = [
        {
            id: 'paypal',
            name: 'PayPal',
            icon: CreditCard,
            minAmount: 10,
            maxAmount: 1000,
            fee: 2.5,
            processingTime: '1-3 days',
            description: 'Fast and secure PayPal transfer',
            isAvailable: true
        },
        {
            id: 'bank',
            name: 'Bank Transfer',
            icon: Building2,
            minAmount: 50,
            maxAmount: 5000,
            fee: 5,
            processingTime: '3-5 days',
            description: 'Direct bank account transfer',
            isAvailable: true
        },
        {
            id: 'crypto',
            name: 'Cryptocurrency',
            icon: Zap,
            minAmount: 25,
            maxAmount: 2500,
            fee: 1,
            processingTime: '1-2 hours',
            description: 'Bitcoin, Ethereum, USDT',
            isAvailable: true
        },
        {
            id: 'mobile_money',
            name: 'Mobile Money',
            icon: Wallet,
            minAmount: 5,
            maxAmount: 500,
            fee: 1.5,
            processingTime: 'Instant',
            description: 'M-Pesa, Airtel Money, etc.',
            isAvailable: user?.country === 'KE' || user?.country === 'GH'
        }
    ];

    // Theme-based styling (simplified for demo)
    const colors = {
        background: theme === 'professional' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
        card: theme === 'professional' ? 'bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50' : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20',
        cardInner: theme === 'professional' ? 'bg-gray-700/30 rounded-lg p-4 border border-gray-600/30' : 'bg-white/5 rounded-lg p-4 border border-white/10',
        buttonPrimary: theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
        buttonSecondary: theme === 'professional' ? 'bg-gray-700/50 hover:bg-gray-600 border border-gray-600/50' : 'bg-white/10 hover:bg-white/20 border border-white/20',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/50',
        border: theme === 'professional' ? 'border-gray-700/50' : 'border-white/20',
        inputBg: theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500',
    };

    // Calculate fees and net amount
    const selectedMethodData = withdrawalMethods.find(m => m.id === selectedMethod);
    const amount = parseFloat(withdrawalAmount) || 0;
    const fee = selectedMethodData ? (amount * selectedMethodData.fee / 100) : 0;
    const netAmount = amount - fee;

    // Mock withdrawal history
    useEffect(() => {
        setWithdrawalHistory([
            {
                id: '1',
                amount: 150.00,
                method: 'PayPal',
                status: 'completed',
                requestedAt: new Date('2024-01-15'),
                processedAt: new Date('2024-01-17'),
                fee: 3.75,
                netAmount: 146.25,
                reference: 'WD-22401'
            },
            {
                id: '2',
                amount: 75.50,
                method: 'Bank Transfer',
                status: 'processing',
                requestedAt: new Date('2024-01-20'),
                fee: 5,
                netAmount: 70.50,
                reference: 'WD-22402'
            },
            {
                id: '3',
                amount: 200.00,
                method: 'Cryptocurrency',
                status: 'pending',
                requestedAt: new Date('2024-01-22'),
                fee: 2,
                netAmount: 198.00,
                reference: 'WD-22403'
            }
        ]);
    }, []);

    const handleWithdrawal = async () => {
        if (!selectedMethod || !amount || amount < (selectedMethodData?.minAmount || 0)) {
            return;
        }
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const newWithdrawal: WithdrawalRequest = {
            id: `WD-${Date.now()}`,
            amount,
            method: selectedMethodData?.name || '',
            status: 'pending',
            requestedAt: new Date(),
            fee,
            netAmount,
            reference: `WD-${Date.now()}`
        };
        setWithdrawalHistory(prev => [newWithdrawal, ...prev]);
        setWithdrawalAmount('');
        setSelectedMethod('');
        setShowConfirmation(false);
        setLoading(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'processing':
                return <Clock className="w-5 h-5 text-amber-400" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-emerald-400';
            case 'processing':
                return 'text-amber-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className={`min-h-screen ${colors.background} p-6`}>
            <button
                onClick={() => navigate('/dashboard')}
                className="mb-6 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition flex items-center gap-2"
            >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Back to Dashboard
            </button>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold ${colors.textPrimary} mb-2`}>
                        Withdrawal System
                    </h1>
                    <p className={`${colors.textSecondary}`}>
                        Manage your earnings and withdraw funds securely
                    </p>
                </div>

                {/* Balance Overview */}
                <div className={`${colors.card} mb-8`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`${colors.cardInner}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`${colors.textSecondary} text-sm`}>Total Balance</span>
                                <DollarSign className="w-5 h-5 text-green-400" />
                            </div>
                            <div className={`${colors.textPrimary} text-2xl font-bold`}>
                                <DualCurrencyDisplay usdAmount={userBalance} userCurrency={user?.currency || 'USD'} />
                            </div>
                        </div>
                        <div className={`${colors.cardInner}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`${colors.textSecondary} text-sm`}>Pending Earnings</span>
                                <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className={`${colors.textPrimary} text-2xl font-bold`}>
                                <DualCurrencyDisplay usdAmount={pendingEarnings} userCurrency={user?.currency || 'USD'} />
                            </div>
                        </div>
                        <div className={`${colors.cardInner}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`${colors.textSecondary} text-sm`}>Available for Withdrawal</span>
                                <Wallet className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className={`${colors.textPrimary} text-2xl font-bold`}>
                                <DualCurrencyDisplay usdAmount={availableForWithdrawal} userCurrency={user?.currency || 'USD'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6">
                    <button
                        onClick={() => setActiveTab('withdraw')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'withdraw'
                            ? `${colors.buttonPrimary} text-white`
                            : `${colors.buttonSecondary} ${colors.textSecondary}`
                            }`}
                    >
                        Withdraw Funds
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'history'
                            ? `${colors.buttonPrimary} text-white`
                            : `${colors.buttonSecondary} ${colors.textSecondary}`
                            }`}
                    >
                        Withdrawal History
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'security'
                            ? `${colors.buttonPrimary} text-white`
                            : `${colors.buttonSecondary} ${colors.textSecondary}`
                            }`}
                    >
                        Security Info
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'withdraw' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Withdrawal Methods */}
                        <div className={`${colors.card}`}>
                            <h2 className={`${colors.textPrimary} text-xl font-semibold mb-6`}>
                                Select Withdrawal Method
                            </h2>
                            <div className="space-y-4">
                                {withdrawalMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        onClick={() => method.isAvailable && setSelectedMethod(method.id)}
                                        className={`${colors.cardInner} cursor-pointer transition-all ${selectedMethod === method.id
                                            ? 'ring-2 ring-blue-400'
                                            : 'hover:bg-opacity-20'
                                            } ${!method.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <method.icon className="w-8 h-8 text-blue-400" />
                                                <div>
                                                    <h3 className={`${colors.textPrimary} font-medium`}>
                                                        {method.name}
                                                    </h3>
                                                    <p className={`${colors.textSecondary} text-sm`}>
                                                        {method.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className={`${colors.textMuted} text-xs`}>
                                                            Min: ${method.minAmount}
                                                        </span>
                                                        <span className={`${colors.textMuted} text-xs`}>
                                                            Fee: {method.fee}%
                                                        </span>
                                                        <span className={`${colors.textMuted} text-xs`}>
                                                            {method.processingTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedMethod === method.id && (
                                                <CheckCircle className="w-6 h-6 text-blue-400" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Withdrawal Form */}
                        <div className={`${colors.card}`}>
                            <h2 className={`${colors.textPrimary} text-xl font-semibold mb-6`}>
                                Withdrawal Details
                            </h2>
                            {selectedMethod ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className={`${colors.textSecondary} block text-sm font-medium mb-2`}>
                                            Amount to Withdraw
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">$</span>
                                            <input
                                                type="number"
                                                value={withdrawalAmount}
                                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                                placeholder="0.00"
                                                className={`${colors.inputBg} w-full pl-8 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2`}
                                                min={selectedMethodData?.minAmount}
                                                max={selectedMethodData?.maxAmount}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className={`${colors.textMuted} text-sm`}>
                                                Min: ${selectedMethodData?.minAmount}
                                            </span>
                                            <span className={`${colors.textMuted} text-sm`}>
                                                Max: ${selectedMethodData?.maxAmount}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Fee Breakdown */}
                                    <div className={`${colors.cardInner}`}>
                                        <h3 className={`${colors.textPrimary} font-medium mb-3`}>Fee Breakdown</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className={`${colors.textSecondary}`}>Withdrawal Amount</span>
                                                <span className={`${colors.textPrimary}`}>
                                                    <DualCurrencyDisplay usdAmount={amount} userCurrency={user?.currency || 'USD'} />
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={`${colors.textSecondary}`}>Processing Fee ({selectedMethodData?.fee}%)</span>
                                                <span className={`${colors.textPrimary}`}>
                                                    <DualCurrencyDisplay usdAmount={fee} userCurrency={user?.currency || 'USD'} />
                                                </span>
                                            </div>
                                            <div className="border-t border-gray-600/30 pt-2">
                                                <div className="flex justify-between font-semibold">
                                                    <span className={`${colors.textPrimary}`}>You'll Receive</span>
                                                    <span className="text-emerald-400">
                                                        <DualCurrencyDisplay usdAmount={netAmount} userCurrency={user?.currency || 'USD'} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowConfirmation(true)}
                                        disabled={!amount || amount < (selectedMethodData?.minAmount || 0) || loading}
                                        className={`w-full py-3 rounded-lg font-medium transition-all ${amount && amount >= (selectedMethodData?.minAmount || 0) && !loading
                                            ? colors.buttonPrimary
                                            : 'bg-gray-600 cursor-not-allowed'
                                            } text-white`}
                                    >
                                        {loading ? 'Processing...' : 'Continue to Withdrawal'}
                                    </button>
                                </div>
                            ) : (
                                <div className={`${colors.cardInner} text-center py-12`}>
                                    <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className={`${colors.textSecondary}`}>
                                        Select a withdrawal method to continue
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className={`${colors.card}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`${colors.textPrimary} text-xl font-semibold`}>
                                Withdrawal History
                            </h2>
                            <button className={`${colors.buttonSecondary} px-4 py-2 rounded-lg ${colors.textSecondary}`}>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={`${colors.border} border-b`}>
                                        <th className={`${colors.textSecondary} text-left py-3 px-4`}>Reference</th>
                                        <th className={`${colors.textSecondary} text-left py-3 px-4`}>Amount</th>
                                        <th className={`${colors.textSecondary} text-left py-3 px-4`}>Method</th>
                                        <th className={`${colors.textSecondary} text-left py-3 px-4`}>Status</th>
                                        <th className={`${colors.textSecondary} text-left py-3 px-4`}>Date</th>
                                        <th className={`${colors.textSecondary} text-left py-3 px-4`}>Fee</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawalHistory.map((withdrawal) => (
                                        <tr key={withdrawal.id} className={`${colors.border} border-b hover:bg-opacity-10`}>
                                            <td className={`${colors.textPrimary} py-3 px-4`}>
                                                {withdrawal.reference}
                                            </td>
                                            <td className={`${colors.textPrimary} py-3 px-4`}>
                                                <DualCurrencyDisplay usdAmount={withdrawal.amount} userCurrency={user?.currency || 'USD'} />
                                            </td>
                                            <td className={`${colors.textPrimary} py-3 px-4`}>
                                                {withdrawal.method}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(withdrawal.status)}
                                                    <span className={getStatusColor(withdrawal.status)}>
                                                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={`${colors.textSecondary} py-3 px-4`}>
                                                {withdrawal.requestedAt.toLocaleDateString()}
                                            </td>
                                            <td className={`${colors.textSecondary} py-3 px-4`}>
                                                <DualCurrencyDisplay usdAmount={withdrawal.fee} userCurrency={user?.currency || 'USD'} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className={`${colors.card}`}>
                        <h2 className={`${colors.textPrimary} text-xl font-semibold mb-6`}>
                            Security Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={`${colors.cardInner}`}>
                                <div className="flex items-center space-x-3 mb-4">
                                    <Shield className="w-8 h-8 text-green-400" />
                                    <h3 className={`${colors.textPrimary} font-semibold`}>Secure Processing</h3>
                                </div>
                                <p className={`${colors.textSecondary} text-sm leading-relaxed`}>
                                    All withdrawals are processed through secure, encrypted channels with bank-level security protocols.
                                </p>
                            </div>
                            <div className={`${colors.cardInner}`}>
                                <div className="flex items-center space-x-3 mb-4">
                                    <Clock className="w-8 h-8 text-blue-400" />
                                    <h3 className={`${colors.textPrimary} font-semibold`}>Processing Times</h3>
                                </div>
                                <p className={`${colors.textSecondary} text-sm leading-relaxed`}>
                                    Processing times vary by method. Most withdrawals are processed within 1-5 business days.
                                </p>
                            </div>
                            <div className={`${colors.cardInner}`}>
                                <div className="flex items-center space-x-3 mb-4">
                                    <AlertCircle className="w-8 h-8 text-amber-400" />
                                    <h3 className={`${colors.textPrimary} font-semibold`}>Verification Required</h3>
                                </div>
                                <p className={`${colors.textSecondary} text-sm leading-relaxed`}>
                                    Large withdrawals may require additional verification for security purposes.
                                </p>
                            </div>
                            <div className={`${colors.cardInner}`}>
                                <div className="flex items-center space-x-3 mb-4">
                                    <TrendingUp className="w-8 h-8 text-purple-400" />
                                    <h3 className={`${colors.textPrimary} font-semibold`}>Fee Transparency</h3>
                                </div>
                                <p className={`${colors.textSecondary} text-sm leading-relaxed`}>
                                    All fees are clearly displayed before processing. No hidden charges or surprise fees.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`${colors.card} max-w-md w-full mx-4`}>
                        <h3 className={`${colors.textPrimary} text-xl font-semibold mb-4`}>
                            Confirm Withdrawal
                        </h3>
                        <div className={`${colors.cardInner} mb-6`}>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className={`${colors.textSecondary}`}>Method:</span>
                                    <span className={`${colors.textPrimary}`}>{selectedMethodData?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={`${colors.textSecondary}`}>Amount:</span>
                                    <span className={`${colors.textPrimary}`}>
                                        <DualCurrencyDisplay usdAmount={amount} userCurrency={user?.currency || 'USD'} />
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={`${colors.textSecondary}`}>Fee:</span>
                                    <span className={`${colors.textPrimary}`}>
                                        <DualCurrencyDisplay usdAmount={fee} userCurrency={user?.currency || 'USD'} />
                                    </span>
                                </div>
                                <div className="border-t border-gray-600/30 pt-3">
                                    <div className="flex justify-between font-semibold">
                                        <span className={`${colors.textPrimary}`}>You'll Receive:</span>
                                        <span className="text-emerald-400">
                                            <DualCurrencyDisplay usdAmount={netAmount} userCurrency={user?.currency || 'USD'} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className={`flex-1 py-3 px-4 rounded-lg ${colors.buttonSecondary} ${colors.textSecondary}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdrawal}
                                disabled={loading}
                                className={`flex-1 py-3 px-4 rounded-lg ${colors.buttonPrimary} text-white`}
                            >
                                {loading ? 'Processing...' : 'Confirm Withdrawal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalSystem; 