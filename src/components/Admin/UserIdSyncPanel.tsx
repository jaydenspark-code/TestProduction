import React, { useState } from 'react';
import { UserIdSynchronizer } from '../../utils/userIdSynchronizer';

interface SyncResult {
  success: boolean;
  message: string;
  fixed?: number;
  errors?: string[];
}

const UserIdSyncPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [emailToValidate, setEmailToValidate] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleFullSync = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const syncResult = await UserIdSynchronizer.synchronizeUserIds();
      setResult(syncResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Sync failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateUser = async () => {
    if (!emailToValidate.trim()) return;
    
    setIsLoading(true);
    setValidationResult(null);
    
    try {
      const validation = await UserIdSynchronizer.validateUserIdConsistency(emailToValidate.trim());
      setValidationResult(validation);
    } catch (error: any) {
      setValidationResult({
        isConsistent: false,
        message: `Validation failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSingleUser = async () => {
    if (!emailToValidate.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const fixResult = await UserIdSynchronizer.fixSingleUser(emailToValidate.trim());
      setResult(fixResult);
      
      // Also refresh validation
      if (fixResult.success) {
        const validation = await UserIdSynchronizer.validateUserIdConsistency(emailToValidate.trim());
        setValidationResult(validation);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Fix failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User ID Synchronization</h2>
      
      <div className="space-y-6">
        {/* Full Synchronization Section */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Full Database Synchronization</h3>
          <p className="text-gray-600 mb-4">
            This will synchronize ALL user IDs between the Supabase auth system and your custom users table.
            Use this to fix widespread ID mismatches.
          </p>
          
          <button
            onClick={handleFullSync}
            disabled={isLoading}
            className={`px-6 py-2 rounded-md font-medium ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Synchronizing...' : 'Run Full Sync'}
          </button>
        </div>

        {/* Single User Section */}
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Single User Operations</h3>
          <p className="text-gray-600 mb-4">
            Validate or fix ID consistency for a specific user by their email address.
          </p>
          
          <div className="space-y-3">
            <div>
              <input
                type="email"
                value={emailToValidate}
                onChange={(e) => setEmailToValidate(e.target.value)}
                placeholder="Enter user email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleValidateUser}
                disabled={isLoading || !emailToValidate.trim()}
                className={`px-4 py-2 rounded-md font-medium ${
                  isLoading || !emailToValidate.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Validate
              </button>
              
              <button
                onClick={handleFixSingleUser}
                disabled={isLoading || !emailToValidate.trim()}
                className={`px-4 py-2 rounded-md font-medium ${
                  isLoading || !emailToValidate.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                Fix User
              </button>
            </div>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-4 rounded-md ${
            validationResult.isConsistent 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className="font-semibold mb-2">
              {validationResult.isConsistent ? '✅ Validation Result' : '❌ Validation Result'}
            </h4>
            <p className="text-sm">{validationResult.message}</p>
            {validationResult.authId && validationResult.publicId && (
              <div className="mt-2 text-xs space-y-1">
                <div>Auth ID: <code className="bg-gray-100 px-1 rounded">{validationResult.authId}</code></div>
                <div>Public ID: <code className="bg-gray-100 px-1 rounded">{validationResult.publicId}</code></div>
              </div>
            )}
          </div>
        )}

        {/* Sync Result */}
        {result && (
          <div className={`p-4 rounded-md ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className="font-semibold mb-2">
              {result.success ? '✅ Sync Result' : '❌ Sync Result'}
            </h4>
            <p className="text-sm">{result.message}</p>
            
            {result.fixed !== undefined && (
              <p className="text-sm mt-1">Users fixed: <strong>{result.fixed}</strong></p>
            )}
            
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium">Errors encountered:</p>
                <ul className="text-xs mt-1 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-red-600">• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• This operation requires admin privileges and service role access</li>
            <li>• Always backup your database before running synchronization</li>
            <li>• The process updates IDs and all related records across tables</li>
            <li>• Users may need to re-login after ID synchronization</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserIdSyncPanel;
