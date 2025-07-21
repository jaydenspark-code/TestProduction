import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface AgentApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  socialPlatform: string;
  platformName: string;
  username: string;
  channelLink: string;
  followerCount: number;
  additionalInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

interface AgentApplicationContextType {
  applications: AgentApplication[];
  addApplication: (application: Omit<AgentApplication, 'id' | 'status' | 'appliedAt'>) => void;
  updateApplicationStatus: (applicationId: string, status: 'approved' | 'rejected', notes: string, reviewedBy: string) => void;
}

const AgentApplicationContext = createContext<AgentApplicationContextType | undefined>(undefined);

export const useAgentApplications = () => {
  const context = useContext(AgentApplicationContext);
  if (!context) {
    throw new Error('useAgentApplications must be used within an AgentApplicationProvider');
  }
  return context;
};

interface AgentApplicationProviderProps {
  children: ReactNode;
}

export const AgentApplicationProvider: React.FC<AgentApplicationProviderProps> = ({ children }) => {
  const { updateUser } = useAuth();
  const [applications, setApplications] = useState<AgentApplication[]>([]);

  const addApplication = (application: Omit<AgentApplication, 'id' | 'status' | 'appliedAt'>) => {
    const newApplication: AgentApplication = {
      ...application,
      id: new Date().toISOString(),
      status: 'pending',
      appliedAt: new Date(),
    };
    setApplications(prev => [...prev, newApplication]);
  };

  const updateApplicationStatus = (applicationId: string, status: 'approved' | 'rejected', notes: string, reviewedBy: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (app && status === 'approved') {
      updateUser({ role: 'agent', isAgent: true });
    }
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? {
            ...app,
            status,
            notes,
            reviewedBy,
            reviewedAt: new Date(),
          }
        : app
    ));
  };

  return (
    <AgentApplicationContext.Provider value={{ applications, addApplication, updateApplicationStatus }}>
      {children}
    </AgentApplicationContext.Provider>
  );
};