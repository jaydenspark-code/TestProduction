/**
 * Legacy Supabase client export for backward compatibility
 * 
 * This file now uses the new DatabaseConnection system which provides:
 * - Robust connection testing
 * - Graceful fallback to testing mode
 * - Environment validation
 * - Connection health monitoring
 * - Automatic reconnection capabilities
 */

import { databaseConnection, getSupabaseClient } from './databaseConnection';

// Export the client for backward compatibility
export const supabase = getSupabaseClient();

// Export additional utilities for enhanced database management
export { databaseConnection, getSupabaseClient };

// Connection status helpers
export const isSupabaseConnected = () => databaseConnection.isConnected();
export const isTestingMode = () => databaseConnection.isTestingMode();
export const getConnectionStatus = () => databaseConnection.getStatus();
export const reconnectDatabase = () => databaseConnection.reconnect();
export const performHealthCheck = () => databaseConnection.healthCheck();
