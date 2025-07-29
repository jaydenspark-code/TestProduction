const PredictiveAnalytics: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  useEffect(() => {
    const loadPredictions = async () => {
      const data = await aiAnalyticsService.getPredictiveInsights({
        timeframe: '30d',
        metrics: ['revenue', 'churn', 'conversion'],
        confidence: 0.8
      });
      setPredictions(data);
    };
    
    loadPredictions();
  }, []);
  
  return (
    <div className="predictive-analytics">
      {predictions.map(prediction => (
        <PredictionCard key={prediction.id} prediction={prediction} />
      ))}
    </div>
  );
};
