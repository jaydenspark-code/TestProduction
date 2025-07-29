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
    console.warn('useAgentApplications called outside of AgentApplicationProvider, using fallback');
    // Return safe fallback values instead of throwing error
    return {
      applications: [],
      addApplication: () => {
        console.warn('addApplication called but no provider available');
      },
      updateApplicationStatus: () => {
        console.warn('updateApplicationStatus called but no provider available');
      }
    };
  }
  return context;
};

interface AgentApplicationProviderProps {
  children: ReactNode;
}

export const AgentApplicationProvider: React.FC<AgentApplicationProviderProps> = ({ children }) => {
  // Safely get auth context, handle case where it might not be available
  const auth = React.useContext(React.createContext({ updateUser: () => {} }));
  let updateUser;
  try {
    ({ updateUser } = useAuth());
  } catch (error) {
    console.warn('AgentApplicationProvider: useAuth not available, using fallback');
    updateUser = () => {};
  }
  
  const [applications, setApplications] = useState<AgentApplication[]>([
    // Mock data for demonstration
    {
      id: 'agent-app-1',
      userId: 'user-5',
      userEmail: 'influencer@example.com',
      userName: 'Alex Influencer',
      socialPlatform: 'instagram',
      platformName: 'Instagram',
      username: 'alexinfluencer',
      channelLink: 'https://instagram.com/alexinfluencer',
      followerCount: 125000,
      additionalInfo: 'I specialize in tech reviews and unboxing videos. My audience is primarily tech-savvy millennials and Gen Z users interested in the latest gadgets and technology trends.',
      status: 'pending',
      appliedAt: new Date(),
    },
    {
      id: 'agent-app-2',
      userId: 'user-6',
      userEmail: 'lifestyle@blogger.com',
      userName: 'Sarah Lifestyle',
      socialPlatform: 'youtube',
      platformName: 'YouTube',
      username: 'sarahlifestyle',
      channelLink: 'https://youtube.com/c/sarahlifestyle',
      followerCount: 89000,
      additionalInfo: 'I create content around lifestyle, wellness, and productivity. My audience consists mainly of working professionals and students looking to improve their daily routines.',
      status: 'approved',
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      reviewedBy: 'Admin User',
      notes: 'Excellent engagement rates and professional content quality. Approved for premium campaigns.',
    },
    {
      id: 'agent-app-3',
      userId: 'user-7',
      userEmail: 'gaming@streamer.com',
      userName: 'Mike Gaming',
      socialPlatform: 'twitch',
      platformName: 'Twitch',
      username: 'mikegaming',
      channelLink: 'https://twitch.tv/mikegaming',
      followerCount: 45000,
      additionalInfo: 'Gaming content creator focusing on strategy games and esports. Active streaming schedule with high viewer engagement during peak hours.',
      status: 'pending',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  ]);

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
    // Note: In a real application, this would update the applicant's role in the database
    // but should NOT update the current admin user's role
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
