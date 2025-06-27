import React, { useState } from 'react';
import { Mail, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { EmailSystemTester } from '../../utils/testEmailSystem';

const EmailTestPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState<any>(null);

  const runEmailTest = async () => {
    setTesting(true);
    try {
      const results = await EmailSystemTester.runFullDiagnostic();
      setLastTest(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (isWorking: boolean) => {
    if (isWorking) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusColor = (isWorking: boolean) => {
    return isWorking ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Mail className="w-6 h-6 text-orange-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email System Status</h3>
            <p className="text-sm text-gray-600">Test Resend API configuration and email delivery</p>
          </div>
        </div>
        <button
          onClick={runEmailTest}
          disabled={testing}
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Test Email System'}
        </button>
      </div>

      {lastTest && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border-2 ${getStatusColor(lastTest.apiTest.isValid && lastTest.apiTest.isConfigured)}`}>
            <div className="flex items-center">
              {getStatusIcon(lastTest.apiTest.isValid && lastTest.apiTest.isConfigured)}
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">
                  {lastTest.apiTest.isValid && lastTest.apiTest.isConfigured 
                    ? 'Email System Working' 
                    : 'Email System Issues Detected'
                  }
                </h4>
                <p className="text-sm text-gray-600">
                  Last tested: {new Date(lastTest.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Environment Check */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-gray-600" />
              Environment Configuration
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Supabase URL:</span>
                <span className={lastTest.environment.supabaseUrl.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                  {lastTest.environment.supabaseUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Supabase Key:</span>
                <span className={lastTest.environment.supabaseKey.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                  {lastTest.environment.supabaseKey}
                </span>
              </div>
            </div>
          </div>

          {/* API Test Results */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-600" />
              API Test Results
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Resend API Configured:</span>
                <span className={lastTest.apiTest.isConfigured ? 'text-green-600' : 'text-red-600'}>
                  {lastTest.apiTest.isConfigured ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Key Valid:</span>
                <span className={lastTest.apiTest.isValid ? 'text-green-600' : 'text-red-600'}>
                  {lastTest.apiTest.isValid ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              {lastTest.apiTest.details?.edgeFunction?.provider && (
                <div className="flex justify-between">
                  <span>Email Provider:</span>
                  <span className="font-medium">
                    {lastTest.apiTest.details.edgeFunction.provider}
                  </span>
                </div>
              )}
              {lastTest.apiTest.details?.edgeFunction?.emailsSent !== undefined && (
                <div className="flex justify-between">
                  <span>Test Emails Sent:</span>
                  <span className={lastTest.apiTest.details.edgeFunction.emailsSent > 0 ? 'text-green-600' : 'text-red-600'}>
                    {lastTest.apiTest.details.edgeFunction.emailsSent}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Troubleshooting */}
          {(!lastTest.apiTest.isValid || !lastTest.apiTest.isConfigured) && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Troubleshooting Steps
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                {!lastTest.apiTest.isConfigured && (
                  <li>Add RESEND_API_KEY to Supabase Edge Functions environment variables</li>
                )}
                {lastTest.apiTest.isConfigured && !lastTest.apiTest.isValid && (
                  <li>Verify the Resend API key is correct and active</li>
                )}
                <li>Redeploy the Edge Function to pick up new environment variables</li>
                <li>Wait 5 minutes for environment variables to propagate</li>
                <li>Check Resend dashboard for account status and limits</li>
              </ul>
            </div>
          )}

          {/* Success Message */}
          {lastTest.apiTest.isValid && lastTest.apiTest.isConfigured && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Email System Ready
              </h4>
              <p className="text-sm text-green-700">
                Your email system is properly configured and ready to send notifications to shippers and admins.
              </p>
            </div>
          )}
        </div>
      )}

      {!lastTest && (
        <div className="text-center py-8 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Click "Test Email System" to check your configuration</p>
        </div>
      )}
    </div>
  );
};

export default EmailTestPanel;