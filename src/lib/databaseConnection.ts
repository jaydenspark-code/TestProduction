import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { envConfig, validateEnvironment } from '../config/environment';
import { mockSupabase } from './mockSupabase';
import { showToast } from '../utils/toast';

export interface DatabaseConnectionStatus {
  connected: boolean;
  testingMode: boolean;
  lastChecked: Date;
  error?: string;
  warnings: string[];
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private supabaseClient: SupabaseClient | null = null;
  private mockClient: any = mockSupabase;
  private connectionStatus: DatabaseConnectionStatus = {
    connected: false,
    testingMode: false,
    lastChecked: new Date(),
    warnings: []
  };

  private constructor() {
    this.initialize();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private async initialize(): Promise<void> {
    console.log('🔧 Initializing database connection...');
    
    // Validate environment configuration
    const envValidation = validateEnvironment();
    
    if (!envValidation.isValid) {
      console.warn('⚠️ Environment validation failed:', envValidation.errors);
      this.connectionStatus = {
        connected: false,
        testingMode: true,
        lastChecked: new Date(),
        error: `Environment configuration errors: ${envValidation.errors.join(', ')}`,
        warnings: envValidation.warnings
      };
      return;
    }

    // Add warnings to status
    if (envValidation.warnings.length > 0) {
      this.connectionStatus.warnings = envValidation.warnings;
    }

    // Try to create Supabase client
    try {
      const { url, anonKey } = envConfig.supabase;
      
      if (url && anonKey && 
          url !== 'your_supabase_project_url_here' && 
          anonKey !== 'your_supabase_anon_key_here') {
        
        this.supabaseClient = createClient(url, anonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
            debug: true // Enable debug to see more CORS details
          },
          global: {
            headers: {
              'X-Client-Info': 'earnpro-app',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            fetch: (url, options = {}) => {
              // Add CORS headers to all requests
              const modifiedOptions = {
                ...options,
                headers: {
                  ...options.headers,
                  'Access-Control-Allow-Origin': '*'
                }
              };
              console.log('🌐 Making request to:', url);
              return fetch(url, modifiedOptions);
            }
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });

        console.log('✅ Supabase client created successfully');

        // Test the connection (but don't fail if test fails)
        const connectionTest = await this.testConnection();
        
        if (connectionTest.success) {
          console.log('✅ Database connection test passed');
          this.connectionStatus = {
            connected: true,
            testingMode: false,
            lastChecked: new Date(),
            warnings: envValidation.warnings
          };
        } else {
          console.warn('⚠️ Database connection test failed, but client is still available:', connectionTest.error);
          this.connectionStatus = {
            connected: false,
            testingMode: false,
            lastChecked: new Date(),
            error: connectionTest.error,
            warnings: [...envValidation.warnings, 'Database connection test failed but client available']
          };
        }
      } else {
        console.log('🧪 Running in testing mode - Supabase credentials not provided');
        this.connectionStatus = {
          connected: false,
          testingMode: true,
          lastChecked: new Date(),
          warnings: [...envValidation.warnings, 'Supabase credentials not provided']
        };
      }
    } catch (error) {
      console.error('❌ Failed to initialize database connection:', error);
      this.connectionStatus = {
        connected: false,
        testingMode: true,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown connection error',
        warnings: [...envValidation.warnings, 'Database initialization failed']
      };
    }
  }

  public getClient(): SupabaseClient | any {
    if (this.connectionStatus.connected && this.supabaseClient) {
      return this.supabaseClient;
    }
    
    // Always return a client - either real or mock
    if (this.supabaseClient) {
      console.log('🔄 Using Supabase client (connection status may be uncertain)');
      return this.supabaseClient;
    }
    
    console.log('🧪 Using mock database client');
    return this.mockClient;
  }

  public getStatus(): DatabaseConnectionStatus {
    return { ...this.connectionStatus };
  }

  public isConnected(): boolean {
    return this.connectionStatus.connected;
  }

  public isTestingMode(): boolean {
    return this.connectionStatus.testingMode;
  }

  private async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.supabaseClient) {
      return { success: false, error: 'No Supabase client available' };
    }

    try {
      // Test authentication
      const { error: authError } = await this.supabaseClient.auth.getSession();
      if (authError) {
        console.warn('⚠️ Auth test warning:', authError.message);
        // Don't fail on auth errors in testing
      }

      // Test database query
      const { error: queryError } = await this.supabaseClient
        .from('users')
        .select('count')
        .limit(1);

      if (queryError) {
        return { 
          success: false, 
          error: `Database query failed: ${queryError.message}` 
        };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  public async reconnect(): Promise<boolean> {
    console.log('🔄 Attempting to reconnect to database...');
    await this.initialize();
    
    if (this.connectionStatus.connected) {
      showToast.success('Database connection restored');
      return true;
    } else if (this.connectionStatus.testingMode) {
      showToast.info('Running in testing mode - some features may be limited');
      return false;
    } else {
      showToast.error('Failed to establish database connection');
      return false;
    }
  }

  public async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: DatabaseConnectionStatus;
  }> {
    const status = this.getStatus();
    
    if (status.connected) {
      // Perform additional health checks if connected
      const connectionTest = await this.testConnection();
      return {
        healthy: connectionTest.success,
        status: connectionTest.success ? 'Connected and healthy' : 'Connected but unhealthy',
        details: {
          ...status,
          error: connectionTest.error,
          lastChecked: new Date()
        }
      };
    } else if (status.testingMode) {
      return {
        healthy: true,
        status: 'Testing mode - limited functionality',
        details: status
      };
    } else {
      return {
        healthy: false,
        status: 'Disconnected',
        details: status
      };
    }
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();

// Export the client getter for backward compatibility
export const getSupabaseClient = () => databaseConnection.getClient();
