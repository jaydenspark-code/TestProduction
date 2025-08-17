import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Users, Plus, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { testAccountsService } from '../../services/testAccountsService';

const TestAccountManager: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{ [email: string]: boolean }>({});
  const [message, setMessage] = useState<string>('');

  const testUsers = [
    { email: 'thearnest7@gmail.com', role: 'Superadmin', name: 'The Earnest' },
    { email: 'ijaydenspark@gmail.com', role: 'User', name: 'Jayden Spark' },
    { email: 'princeedie142@gmail.com', role: 'User', name: 'Prince Edie' },
    { email: 'noguyliketrey@gmail.com', role: 'User', name: 'Noguyliketrey Trey' }
  ];

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  const deleteButtonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800';

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
  const status = await testAccountsService.checkTestAccounts();
      setAccountStatus(status);
    } catch (error) {
      console.error('Error checking account status:', error);
      setMessage('Error checking account status');
    }
  };

  const handleCreateAccounts = async () => {
    setLoading(true);
    setMessage('');
    
    try {
  const result = await testAccountsService.createAllTestAccounts();
      setMessage(result.message);
      
      if (result.success) {
        await checkAccountStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Error creating accounts:', error);
      setMessage('Error creating test accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccounts = async () => {
    if (!window.confirm('Are you sure you want to delete all test accounts? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
  const result = await testAccountsService.deleteAllTestAccounts();
      setMessage(result.message);
      
      if (result.success) {
        await checkAccountStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Error deleting accounts:', error);
      setMessage('Error deleting test accounts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Users className="w-6 h-6 mr-2" />
          Test Account Manager
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={handleCreateAccounts}
            disabled={loading}
            className={`${buttonClass} text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50`}
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Create All</span>
          </button>
          <button
            onClick={handleDeleteAccounts}
            disabled={loading}
            className={`${deleteButtonClass} text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
          <p className="text-white text-sm">{message}</p>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-white font-medium mb-3">Test Accounts:</h4>
        {testUsers.map((user) => (
          <div
            key={user.email}
            className={`flex items-center justify-between p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'Superadmin' ? 'bg-yellow-500/20' : 'bg-purple-500/20'}`}>
                <Users className={`w-5 h-5 ${user.role === 'Superadmin' ? 'text-yellow-300' : 'text-purple-300'}`} />
              </div>
              <div>
                <div className="text-white font-medium">{user.name}</div>
                <div className="text-white/70 text-sm">{user.email}</div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                  user.role === 'Superadmin' 
                    ? 'bg-yellow-500/20 text-yellow-300' 
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {user.role}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {accountStatus[user.email] !== undefined ? (
                accountStatus[user.email] ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Exists</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Missing</span>
                  </div>
                )
              ) : (
                <div className="flex items-center space-x-1 text-gray-400">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Checking...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-6 p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/20' : 'bg-white/5'} border ${theme === 'professional' ? 'border-gray-600/20' : 'border-white/10'}`}>
        <h5 className="text-white font-medium mb-2">Login Information:</h5>
        <div className="text-white/80 text-sm space-y-1">
          <p><strong>Password for all accounts:</strong> 1234567890</p>
          <p><strong>Features:</strong> All accounts are pre-verified and have paid status</p>
          <p><strong>Superadmin:</strong> thearnest7@gmail.com - Full admin access</p>
          <p><strong>Users:</strong> Other emails - Regular user access</p>
        </div>
      </div>
    </div>
  );
};

export default TestAccountManager;
