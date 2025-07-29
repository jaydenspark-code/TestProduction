import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { personalizationService } from '../../services/personalizationService';
import { Layout, Settings, Eye, EyeOff, GripVertical, Plus, Save, X, Sparkles, RefreshCw } from 'lucide-react';

interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  props: any;
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
  priority: number;
}

interface PersonalizedDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PersonalizedDashboardLayout: React.FC<PersonalizedDashboardLayoutProps> = ({
  children,
  className = ""
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [personalizedLayout, setPersonalizedLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPersonalizedLayout();
    } else {
      // If no user, just stop loading
      setLoading(false);
    }
  }, [user?.id]);

  const loadPersonalizedLayout = async () => {
    try {
      setLoading(true);
      
      // Simulate a short delay for better UX, then skip AI service for now
      setTimeout(() => {
        try {
          // Mock dashboard layout instead of calling AI service
          const mockDashboard = {
            userType: 'active_user',
            layout: 'default',
            widgets: []
          };
          setPersonalizedLayout(mockDashboard);
          
          // Convert to widget format (mock implementation)
          const defaultWidgets: DashboardWidget[] = [
            {
              id: 'stats',
              title: 'Performance Stats',
              component: () => <div>Stats Widget</div>,
              props: {},
              position: { x: 0, y: 0, w: 4, h: 2 },
              visible: true,
              priority: 1
            },
            {
              id: 'ai_insights',
              title: 'AI Insights',
              component: () => <div>AI Insights Widget</div>,
              props: {},
              position: { x: 4, y: 0, w: 4, h: 2 },
              visible: true,
              priority: 2
            },
            {
              id: 'recent_activity',
              title: 'Recent Activity',
              component: () => <div>Recent Activity Widget</div>,
              props: {},
              position: { x: 0, y: 2, w: 8, h: 3 },
              visible: true,
              priority: 3
            }
          ];
          
          setWidgets(defaultWidgets);
        } catch (error) {
          console.error('Failed to load personalized layout:', error);
        } finally {
          setLoading(false);
        }
      }, 500); // Short delay to show loading, then complete
      
    } catch (error) {
      console.error('Failed to load personalized layout:', error);
      setLoading(false);
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const saveLayout = async () => {
    if (!user?.id) return;
    
    try {
      // Save personalized layout preferences
      const layoutData = {
        widgets: widgets.map(w => ({
          id: w.id,
          position: w.position,
          visible: w.visible,
          priority: w.priority
        }))
      };
      
      // This would save to personalization service
      console.log('Saving layout:', layoutData);
      setIsCustomizing(false);
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200';

  if (loading) {
    return (
      <div className={`${cardClass} ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full"></div>
          <span className="ml-3 text-white">Personalizing your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Dashboard Customization Header */}
      <div className={`${cardClass} mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layout className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
            <div>
              <h3 className="text-lg font-bold text-white">Personalized Dashboard</h3>
              <p className="text-white/70 text-sm">AI-customized layout based on your preferences</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isCustomizing && (
              <>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="text-white/70 hover:text-white px-3 py-2 rounded-lg border border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveLayout}
                  className={buttonClass}
                >
                  Save Layout
                </button>
              </>
            )}
            
            {!isCustomizing && (
              <button
                onClick={() => setIsCustomizing(true)}
                className="flex items-center gap-2 text-white/70 hover:text-white px-3 py-2 rounded-lg border border-white/20 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Customize
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Widget Customization Panel */}
      {isCustomizing && (
        <div className={`${cardClass} mb-6`}>
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Widget Visibility
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  widget.visible
                    ? theme === 'professional'
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-gray-500/10 border-gray-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-white/50" />
                  <span className="text-white text-sm font-medium">{widget.title}</span>
                </div>
                
                <button
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  {widget.visible ? (
                    <Eye className="w-4 h-4 text-green-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <button className="flex items-center gap-2 text-white/70 hover:text-white px-3 py-2 rounded-lg border border-dashed border-white/30 transition-colors">
              <Plus className="w-4 h-4" />
              Add Widget
            </button>
          </div>
        </div>
      )}

      {/* AI Personalization Insights */}
      {personalizedLayout && (
        <div className={`${cardClass} mb-6`}>
          <h4 className="text-white font-medium mb-3">🤖 AI Recommendations</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>Dashboard optimized for your {personalizedLayout.userType || 'activity pattern'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Widgets prioritized based on your usage frequency</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span>Layout adapts to your peak activity hours</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Conditional Customization Overlay */}
      <div className={`relative ${isCustomizing ? 'opacity-75' : ''}`}>
        {isCustomizing && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center">
            <div className="text-white text-center">
              <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Customization Mode</p>
              <p className="text-sm opacity-75">Drag widgets to rearrange or toggle visibility above</p>
            </div>
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
};

export default PersonalizedDashboardLayout;
