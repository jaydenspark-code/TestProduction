import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userCountry: string;
  type: 'deposit' | 'payout';
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'paystack';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export class TransactionService {
  static async getTransactions(type: 'deposits' | 'payouts'): Promise<Transaction[]> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Returning mock transactions');
      return this.getMockTransactions(type);
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          userId,
          users:user_id (email, country),
          type,
          amount,
          payment_method,
          status,
          created_at
        `)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(transaction => ({
        id: transaction.id,
        userId: transaction.userId,
        userEmail: transaction.users.email,
        userCountry: transaction.users.country,
        type: transaction.type,
        amount: transaction.amount,
        paymentMethod: transaction.payment_method,
        status: transaction.status,
        timestamp: transaction.created_at
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  static async createTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction | null> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Simulating transaction creation');
      return {
        id: `mock-${Date.now()}`,
        userId: transaction.userId,
        userEmail: transaction.userEmail,
        userCountry: transaction.userCountry,
        type: transaction.type,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: transaction.userId,
            type: transaction.type,
            amount: transaction.amount,
            payment_method: transaction.paymentMethod,
            status: transaction.status
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        userEmail: transaction.userEmail,
        userCountry: transaction.userCountry,
        type: data.type,
        amount: data.amount,
        paymentMethod: data.payment_method,
        status: data.status,
        timestamp: data.created_at
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  static async updateTransactionStatus(id: string, status: Transaction['status']): Promise<boolean> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Simulating transaction status update');
      return true;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return false;
    }
  }

  // Mock methods for testing mode
  private static getMockTransactions(type: 'deposits' | 'payouts'): Transaction[] {
    const mockTransactions: Transaction[] = [
      {
        id: 'mock-1',
        userId: 'test-user-1',
        userEmail: 'test@example.com',
        userCountry: 'US',
        type: type === 'deposits' ? 'deposit' : 'payout',
        amount: 150.00,
        paymentMethod: 'paypal',
        status: 'completed',
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: 'mock-2',
        userId: 'test-user-2',
        userEmail: 'test2@example.com',
        userCountry: 'NG',
        type: type === 'deposits' ? 'deposit' : 'payout',
        amount: 75.50,
        paymentMethod: 'paystack',
        status: 'pending',
        timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
      },
      {
        id: 'mock-3',
        userId: 'test-user-3',
        userEmail: 'test3@example.com',
        userCountry: 'UK',
        type: type === 'deposits' ? 'deposit' : 'payout',
        amount: 200.00,
        paymentMethod: 'stripe',
        status: 'completed',
        timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ];

    return mockTransactions;
  }
}
