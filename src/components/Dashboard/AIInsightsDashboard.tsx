export const AIInsightsDashboard = () => {
  const [insights, setInsights] = useState({
    personalizedRecommendations: [],
    earningsPrediction: null,
    optimalActivityTimes: [],
    networkGrowthSuggestions: [],
    riskAlerts: []
  });
  
  useEffect(() => {
    const loadAIInsights = async () => {
      const aiData = await aiDashboardAPI.getDashboardData(user.id);
      
      setInsights({
        personalizedRecommendations: aiData.recommendations,
        earningsPrediction: aiData.revenueInsight,
        optimalActivityTimes: aiData.behaviorInsights.optimalTimes,
        networkGrowthSuggestions: aiData.networkingSuggestions,
        riskAlerts: aiData.riskFactors
      });
    };
    
    loadAIInsights();
    
    // Real-time updates every 5 minutes
    const interval = setInterval(loadAIInsights, 300000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="ai-insights-grid">
      <PersonalizedRecommendations data={insights.personalizedRecommendations} />
      <EarningsPredictionCard prediction={insights.earningsPrediction} />
      <OptimalActivityWidget times={insights.optimalActivityTimes} />
      <NetworkGrowthSuggestions suggestions={insights.networkGrowthSuggestions} />
    </div>
  );
};
