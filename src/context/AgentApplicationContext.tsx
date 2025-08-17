import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { realtimeService } from '../services/realtimeService';

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
  
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch applications from backend
  const fetchApplications = async () => {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Using mock data for agent applications');
      setApplications([
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
          additionalInfo: 'I specialize in tech reviews and unboxing videos.',
          status: 'pending',
          appliedAt: new Date(),
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('agent_applications')
        .select(`
          id,
          user_id,
          status,
          experience,
          motivation,
          social_media_links,
          portfolio_url,
          submitted_at,
          reviewed_at,
          reviewed_by,
          feedback,
          users!inner (
            email,
            full_name
          )
        `)
        .order('submitted_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching agent applications:', fetchError);
        setError('Failed to load applications');
        return;
      }

      const mappedApplications: AgentApplication[] = data?.map(app => ({
        id: app.id,
        userId: app.user_id,
        userEmail: app.users?.email || '',
        userName: app.users?.full_name || '',
        socialPlatform: app.social_media_links?.[0]?.platform || 'unknown',
        platformName: app.social_media_links?.[0]?.platformName || 'Unknown',
        username: app.social_media_links?.[0]?.username || '',
        channelLink: app.social_media_links?.[0]?.url || '',
        followerCount: app.social_media_links?.[0]?.followers || 0,
        additionalInfo: app.motivation || '',
        status: app.status,
        appliedAt: new Date(app.submitted_at),
        reviewedAt: app.reviewed_at ? new Date(app.reviewed_at) : undefined,
        reviewedBy: app.reviewed_by || undefined,
        notes: app.feedback || undefined,
      })) || [];

      setApplications(mappedApplications);
      console.log(`✅ Loaded ${mappedApplications.length} agent applications`);
    } catch (error) {
      console.error('Error fetching agent applications:', error);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Load applications on mount
  useEffect(() => {
    fetchApplications();

    // Set up real-time subscription for new applications
    if (supabase) {
      const subscription = supabase
        .channel('agent_applications_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'agent_applications' },
          (payload) => {
            console.log('Agent application change detected:', payload);
            // Refresh applications when changes occur
            fetchApplications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const addApplication = (application: Omit<AgentApplication, 'id' | 'status' | 'appliedAt'>) => {
    const newApplication: AgentApplication = {
      ...application,
      id: new Date().toISOString(),
      status: 'pending',
      appliedAt: new Date(),
    };
    setApplications(prev => [...prev, newApplication]);
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected', notes: string, reviewedBy: string) => {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Updating application status locally');
      
      // Find the application to get user details
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        console.error('Application not found:', applicationId);
        return;
      }

      // Update local state
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

      // In testing mode, we need to manually trigger user role update
      if (status === 'approved') {
        console.log('🎯 TESTING MODE: Simulating user role update to agent');
        
        // Store approved agent in localStorage for testing mode
        const approvedAgents = JSON.parse(localStorage.getItem('approvedAgents') || '[]');
        if (!approvedAgents.includes(application.userEmail)) {
          approvedAgents.push(application.userEmail);
          localStorage.setItem('approvedAgents', JSON.stringify(approvedAgents));
          console.log('✅ Stored approved agent in localStorage:', application.userEmail);
        }
        
        // Broadcast a custom window event for testing mode
        const event = new CustomEvent('agentApprovalUpdate', {
          detail: {
            userId: application.userId,
            newRole: 'agent',
            userEmail: application.userEmail
          }
        });
        window.dispatchEvent(event);
        
        console.log('✅ Agent approval event dispatched for testing mode');
      }
      
      return;
    }

    try {
      // Find the application to get user details
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        console.error('Application not found:', applicationId);
        return;
      }

      // Update application status in database
      const { error: updateError } = await supabase
        .from('agent_applications')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
          feedback: notes
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating application status:', updateError);
        setError('Failed to update application status');
        return;
      }

      // If approved, update user role to agent
      if (status === 'approved') {
        const { error: roleError } = await supabase
          .from('users')
          .update({ role: 'agent' })
          .eq('id', application.userId);

        if (roleError) {
          console.error('Error updating user role:', roleError);
          // Continue anyway - application status was updated
        } else {
          console.log('✅ User role updated to agent for user:', application.userId);
        }
      }

      // Send notification to the user
      const notificationTitle = status === 'approved' 
        ? '🎉 Agent Application Approved!' 
        : '❌ Agent Application Update';
      
      const notificationMessage = status === 'approved'
        ? 'Congratulations! Your agent application has been approved. You can now access agent features.'
        : `Your agent application has been ${status}. ${notes ? `Feedback: ${notes}` : ''}`;

      await realtimeService.sendNotification(application.userId, {
        userId: application.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'approved' ? 'success' : 'info'
      });

      // If approved, broadcast user role change event to trigger session refresh
      if (status === 'approved') {
        console.log('🚀 Broadcasting role update event for user:', application.userId);
        realtimeService.broadcastEvent({
          type: 'user_role_updated',
          data: {
            userId: application.userId,
            newRole: 'agent',
            message: 'Your role has been updated to Agent. Please refresh to see new features.'
          },
          userId: application.userId
        });
        console.log('✅ Role update event broadcasted');
      }

      // Update local state
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

      console.log(`✅ Application ${applicationId} ${status} successfully`);
    } catch (error) {
      console.error('Error updating application status:', error);
      setError('Failed to update application status');
    }
  };

  return (
    <AgentApplicationContext.Provider value={{ applications, addApplication, updateApplicationStatus }}>
      {children}
    </AgentApplicationContext.Provider>
  );
};
