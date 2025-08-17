import { User, ReferralStats, AgentStats, Task, Campaign, ChatMessage } from '../types';

// Mock data for a more realistic testing environment
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'test@example.com',
  fullName: 'Mock User',
  country: 'US',
  currency: 'USD',
  isVerified: true,
  isPaidUser: true,
  referralCode: 'MOCK123',
  role: 'user',
  isAgent: false,
  createdAt: new Date(),
};

// Mock Supabase client for testing and offline development
export const mockSupabase = {
  auth: {
    getSession: async () => ({
      data: { session: { user: { id: MOCK_USER.id } } as any },
      error: null,
    }),
    getUser: async () => ({
      data: { user: { id: MOCK_USER.id, email: MOCK_USER.email } as any },
      error: null,
    }),
    signInWithPassword: async () => ({
      data: { user: { id: MOCK_USER.id } as any, session: {} as any },
      error: null,
    }),
    signUp: async () => ({
      data: { user: { id: MOCK_USER.id } as any, session: {} as any },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          if (table === 'users') {
            return { data: MOCK_USER, error: null };
          }
          return { data: {}, error: null };
        },
      }),
    }),
    insert: () => Promise.resolve({ data: [{}], error: null }),
    update: () => Promise.resolve({ data: [{}], error: null }),
    delete: () => Promise.resolve({ data: [{}], error: null }),
  }),
};

