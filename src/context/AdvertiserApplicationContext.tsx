import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface AdvertiserApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  campaignTitle: string;
  campaignDescription: string;
  targetAudience: string;
  budgetRange: string;
  campaignDuration: string;
  campaignObjectives: string[];
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

interface AdvertiserApplicationContextType {
  applications: AdvertiserApplication[];
  addApplication: (application: Omit<AdvertiserApplication, 'id' | 'status' | 'appliedAt'>) => void;
  updateApplicationStatus: (applicationId: string, status: 'approved' | 'rejected', notes: string, reviewedBy: string) => void;
}

const AdvertiserApplicationContext = createContext<AdvertiserApplicationContextType | undefined>(undefined);

export const useAdvertiserApplications = () => {
  const context = useContext(AdvertiserApplicationContext);
  if (!context) {
    console.warn('useAdvertiserApplications called outside of AdvertiserApplicationProvider, using fallback');
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

export const AdvertiserApplicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Safely get auth context, handle case where it might not be available
  let updateUser;
  try {
    ({ updateUser } = useAuth());
  } catch (error) {
    console.warn('AdvertiserApplicationProvider: useAuth not available, using fallback');
    updateUser = () => {};
  }
  const [applications, setApplications] = useState<AdvertiserApplication[]>([
    // Mock data for demonstration
    {
      id: 'adv-app-1',
      userId: 'user-3',
      userEmail: 'advertiser@example.com',
      userName: 'John Advertiser',
      companyName: 'AdCorp',
      contactName: 'John Smith',
      contactPhone: '123-456-7890',
      contactEmail: 'john@adcorp.com',
      campaignTitle: 'New Product Launch',
      campaignDescription: 'Launching our new innovative gadget with cutting-edge features designed for tech enthusiasts and early adopters.',
      targetAudience: 'Tech enthusiasts, early adopters, professionals aged 25-45',
      budgetRange: '$5,000 - $10,000',
      campaignDuration: '1 Month',
      campaignObjectives: ['Brand Awareness', 'Lead Generation'],
      status: 'pending',
      appliedAt: new Date(),
    },
    {
      id: 'adv-app-2',
      userId: 'user-4',
      userEmail: 'marketing@techstart.com',
      userName: 'Sarah Johnson',
      companyName: 'TechStart Inc',
      contactName: 'Sarah Johnson',
      contactPhone: '555-678-9012',
      contactEmail: 'sarah@techstart.com',
      campaignTitle: 'Mobile App Promotion',
      campaignDescription: 'Promoting our new mobile application that helps users manage their daily tasks efficiently.',
      targetAudience: 'Young professionals, productivity enthusiasts, mobile users',
      budgetRange: '$10,000 - $20,000',
      campaignDuration: '2 Months',
      campaignObjectives: ['App Downloads', 'User Acquisition', 'Brand Awareness'],
      status: 'approved',
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      reviewedBy: 'Admin User',
      notes: 'Strong campaign proposal with clear objectives and realistic budget.',
    },
  ]);

  const addApplication = (application: Omit<AdvertiserApplication, 'id' | 'status' | 'appliedAt'>) => {
    const newApplication: AdvertiserApplication = {
      ...application,
      id: `adv-app-${Date.now()}`,
      status: 'pending',
      appliedAt: new Date(),
    };
    setApplications(prev => [...prev, newApplication]);
  };

  const updateApplicationStatus = (applicationId: string, status: 'approved' | 'rejected', notes: string, reviewedBy: string) => {
    // Note: In a real application, this would update the applicant's role in the database
    // but should NOT update the current admin user's role
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status, notes, reviewedBy, reviewedAt: new Date() }
          : app
      )
    );
  };

  return (
    <AdvertiserApplicationContext.Provider value={{ applications, addApplication, updateApplicationStatus }}>
      {children}
    </AdvertiserApplicationContext.Provider>
  );
};
