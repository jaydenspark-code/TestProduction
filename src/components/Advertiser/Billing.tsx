import React from 'react';
import { CreditCard, DollarSign, Plus, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

const Billing: React.FC = () => {
  const balance = 2345.67;
  const transactions: Transaction[] = [
    { id: '1', date: new Date(), description: 'Added funds', amount: 500, type: 'credit' },
    { id: '2', date: new Date(Date.now() - 86400000), description: 'Campaign "Summer Product Launch"', amount: -150.50, type: 'debit' },
    { id: '3', date: new Date(Date.now() - 172800000), description: 'Campaign "Holiday Promotion"', amount: -300, type: 'debit' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold flex items-center">
        <CreditCard className="mr-2" /> Billing & Payments
      </h2>

      {/* Balance and Add Funds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Current Balance</h3>
          <p className="text-4xl font-bold text-green-400">{formatCurrency(balance)}</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center">
            <Plus className="mr-2" /> Add Funds
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">Secure payments via Stripe</p>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center"><FileText className="mr-2" /> Transaction History</h3>
        <div className="bg-gray-800/50 rounded-lg">
          <ul className="divide-y divide-gray-700">
            {transactions.map(tx => (
              <li key={tx.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-gray-400">{tx.date.toLocaleDateString()}</p>
                </div>
                <p className={`font-bold text-lg ${tx.type === 'credit' ? 'text-green-400' : ''}`}>
                  {tx.type === 'credit' ? '+' : ''}{formatCurrency(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Billing;
