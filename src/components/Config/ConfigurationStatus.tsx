import React from 'react';
import { AlertCircle, CheckCircle, Mail, Database, Zap, CreditCard } from 'lucide-react';
import { envConfig, validateEnvironment } from '../../config/environment';
import { supabase } from '../../lib/supabase';

interface ConfigStatusProps {
  showDetails?: boolean;
}

const ConfigurationStatus: React.FC<ConfigStatusProps> = ({ showDetails = false }) => {
  const validation = validateEnvironment();
  const hasSupabase = !!supabase;
  const hasEmail = envConfig.sendgrid.apiKey && envConfig.sendgrid.apiKey !== 'your_sendgrid_api_key_here';
  const hasPayments = envConfig.paypal.clientId && envConfig.paypal.clientId !== '';

  const services = [
    {
      name: 'Database',
      icon: Database,
      status: hasSupabase,
      description: hasSupabase ? 'Connected to Supabase' : 'Running in testing mode - no database connection'
    },
    {
      name: 'Email Service',
      icon: Mail,
      status: hasEmail,
      description: hasEmail ? 'SendGrid configured' : 'Email verification disabled - configure SendGrid to enable'
    },
    {
      name: 'Payment System',
      icon: CreditCard,
      status: hasPayments,
      description: hasPayments ? 'PayPal configured' : 'Payment processing disabled - configure PayPal to enable'
    },
    {
      name: 'Real-time Features',
      icon: Zap,
      status: hasSupabase && envConfig.realtime.enabled,
      description: hasSupabase && envConfig.realtime.enabled ? 'Real-time features active' : 'Real-time features disabled'
    }
  ];

  if (!showDetails && validation.isValid && hasSupabase && hasEmail && hasPayments) {
    return null; // Don't show anything if everything is configured
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            System Configuration Status
          </h3>
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            {!hasEmail && (
              <p className="mb-2">
                <strong>Email verification is currently disabled.</strong> To enable email verification for new registrations, 
                configure SendGrid in your environment variables.
              </p>
            )}
            {!hasSupabase && (
              <p className="mb-2">
                <strong>Running in testing mode.</strong> Database features are simulated. 
                Configure Supabase to enable full functionality.
              </p>
            )}
            {!hasPayments && (
              <p className="mb-2">
                <strong>Payment processing is disabled.</strong> Configure PayPal to enable account activation payments.
              </p>
            )}
          </div>

          {showDetails && (
            <div className="mt-3 space-y-2">
              {services.map((service, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <service.icon className="w-4 h-4 text-gray-500" />
                  {service.status ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {service.name}: {service.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
            For production deployment, ensure all services are properly configured in your environment variables.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStatus;
