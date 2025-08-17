import React, { useState } from 'react';
import { verifyGoogleOAuthUsers, checkRecentGoogleUsers } from '../../utils/verifyGoogleOAuth';
import { diagnoseGoogleOAuthIssue, checkRLSPolicies } from '../../utils/diagnoseGoogleOAuth';
import { applyGoogleOAuthRLSFix, getManualSQLFix } from '../../utils/fixGoogleOAuthRLS';
import { listAllTables, generateGrantAllAccessSQL, diagnoseCurrentUserAccess } from '../../utils/comprehensiveDatabaseAnalysis';
import runDatabaseDiagnostics from '../../utils/realTimeDatabaseTest';

const GoogleOAuthVerification: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [diagnosisResults, setDiagnosisResults] = useState<any>(null);
  const [fixResults, setFixResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);

  const runVerification = async () => {
    setLoading(true);
    console.log('🔍 Starting Google OAuth user verification...');
    
    try {
      // Check recent users first
      await checkRecentGoogleUsers();
      
      // Then run full verification
      const verificationResults = await verifyGoogleOAuthUsers();
      setResults(verificationResults);
      
    } catch (error) {
      console.error('Verification error:', error);
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const applyRLSFix = async () => {
    setFixLoading(true);
    console.log('🔧 Applying Google OAuth RLS fix...');
    
    try {
      const fixResult = await applyGoogleOAuthRLSFix();
      setFixResults(fixResult);
      
      if (!fixResult.success) {
        // Show manual SQL fix
        console.log('📋 Manual SQL Fix:');
        console.log(getManualSQLFix());
        alert('Automatic fix failed. Check console for manual SQL fix.');
      }
      
    } catch (error) {
      console.error('Fix error:', error);
      setFixResults({ success: false, error: error.message });
    } finally {
      setFixLoading(false);
    }
  };

  const runRealTimeTest = async () => {
    setDiagnosisLoading(true);
    console.log('🔍 Running real-time database test...');
    
    try {
      const testResults = await runDatabaseDiagnostics();
      setDiagnosisResults(testResults);
      
    } catch (error: any) {
      console.error('Real-time test error:', error);
      setDiagnosisResults({ success: false, error: error.message });
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const showUniversalFix = () => {
    const universalSQL = generateGrantAllAccessSQL();
    console.log('🛠️ UNIVERSAL DATABASE ACCESS FIX:');
    console.log(universalSQL);
    alert('Universal database access fix copied to console. This will grant Google OAuth users access to ALL tables.');
  };

  const runComprehensiveDiagnosis = async () => {
    setDiagnosisLoading(true);
    console.log('🔍 Running comprehensive diagnosis...');
    
    try {
      // List all tables
      console.log('\n=== LISTING ALL TABLES ===');
      await listAllTables();
      
      // Diagnose current user access
      console.log('\n=== DIAGNOSING CURRENT USER ACCESS ===');
      const diagnosis = await diagnoseCurrentUserAccess();
      setDiagnosisResults(diagnosis);
      
    } catch (error: any) {
      console.error('Comprehensive diagnosis error:', error);
      setDiagnosisResults({ success: false, error: error.message });
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const showManualFix = () => {
    const sqlFix = getManualSQLFix();
    console.log('📋 Manual SQL Fix:');
    console.log(sqlFix);
    alert('Manual SQL fix copied to console. Please apply in Supabase SQL Editor.');
  };

  const runDiagnosis = async () => {
    setDiagnosisLoading(true);
    console.log('🔍 Starting Google OAuth diagnosis...');
    
    try {
      const diagnosisResult = await diagnoseGoogleOAuthIssue();
      setDiagnosisResults(diagnosisResult);
      
    } catch (error) {
      console.error('Diagnosis error:', error);
      setDiagnosisResults({ success: false, error: error.message });
    } finally {
      setDiagnosisLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 z-50 max-w-sm">
      <h3 className="text-white font-medium mb-3">Google OAuth Debug</h3>
      
      <div className="space-y-2">
        <button
          onClick={runVerification}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Verify Google OAuth Users'}
        </button>
        
        <button
          onClick={runRealTimeTest}
          disabled={diagnosisLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {diagnosisLoading ? 'Testing...' : '🧪 Real-Time Database Test'}
        </button>
        
        <button
          onClick={runComprehensiveDiagnosis}
          disabled={diagnosisLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {diagnosisLoading ? 'Diagnosing...' : 'Comprehensive Diagnosis'}
        </button>
        
        <button
          onClick={applyRLSFix}
          disabled={fixLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {fixLoading ? 'Fixing...' : 'Apply Basic RLS Fix'}
        </button>
        
        <button
          onClick={showUniversalFix}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          🛠️ Universal DB Access Fix
        </button>
        
        <button
          onClick={showManualFix}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          Show Manual SQL Fix
        </button>
      </div>
      
      {fixResults && (
        <div className="mt-4 text-sm">
          <div className="text-white font-medium mb-2">RLS Fix Results:</div>
          {fixResults.success ? (
            <div className="text-green-300">
              ✅ {fixResults.message}
            </div>
          ) : (
            <div className="text-red-300">
              ❌ {fixResults.error}
              <div className="text-yellow-300 mt-1 text-xs">
                💡 Use "Show Manual SQL Fix" button for manual application
              </div>
            </div>
          )}
        </div>
      )}
      
      {diagnosisResults && (
        <div className="mt-4 text-sm">
          <div className="text-white font-medium mb-2">Diagnosis Results:</div>
          {diagnosisResults.success ? (
            <div className="text-green-300">
              ✅ {diagnosisResults.message}
            </div>
          ) : (
            <div className="text-red-300">
              ❌ {diagnosisResults.error}
              {diagnosisResults.solution && (
                <div className="text-yellow-300 mt-1">
                  💡 {diagnosisResults.solution}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {results && (
        <div className="mt-4 text-sm">
          {results.success ? (
            <div className="text-green-300">
              <div>✅ Total Google Users: {results.summary.totalGoogleUsers}</div>
              <div>✅ In Both Tables: {results.summary.usersInBothTables}</div>
              <div>❌ Missing from Public: {results.summary.missingFromPublic}</div>
            </div>
          ) : (
            <div className="text-red-300">
              ❌ Error: {results.error}
            </div>
          )}
          
          <div className="text-white/60 text-xs mt-2">
            Check console for detailed results
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleOAuthVerification;
