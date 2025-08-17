import React, { useState } from 'react';
import { BarChart2, Target, TrendingUp, Brain, Zap } from 'lucide-react';

interface OptimizationSuggestion {
  type: string;
  description: string;
  impact: string;
  confidence: number;
}

const AIOptimization: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([
    {
      type: 'Targeting',
      description: 'Expand to tech-savvy millennials in urban areas',
      impact: 'Potential 25% increase in conversion rate',
      confidence: 0.85
    },
    {
      type: 'Timing',
      description: 'Shift campaign delivery to peak engagement hours (2PM - 6PM)',
      impact: 'Expected 15% improvement in CTR',
      confidence: 0.92
    },
    {
      type: 'Budget',
      description: 'Reallocate 30% budget to high-performing channels',
      impact: 'Projected 20% increase in ROAS',
      confidence: 0.78
    }
  ]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    // Simulate AI optimization process
    setTimeout(() => {
      setIsOptimizing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-400" />
          AI Campaign Optimization
        </h2>
        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">CTR</span>
              <span className="text-white font-medium">3.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-white font-medium">2.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">ROAS</span>
              <span className="text-white font-medium">2.5x</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Target Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Target CTR</span>
              <span className="text-green-400 font-medium">4.0%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Target Conversion</span>
              <span className="text-green-400 font-medium">3.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Target ROAS</span>
              <span className="text-green-400 font-medium">3.0x</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-lg font-medium text-white mb-4">AI Suggestions</h3>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium">{suggestion.type}</h4>
                <span className="text-sm px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                  {(suggestion.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">{suggestion.description}</p>
              <p className="text-green-400 text-sm">{suggestion.impact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIOptimization;