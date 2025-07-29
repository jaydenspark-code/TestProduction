import React from 'react';
import { Brain, Zap, TrendingUp, Target, RefreshCw } from 'lucide-react';

interface AIOptimizationPanelProps {
  campaign: any;
  aiInsights: any;
  onOptimize: () => void;
  onGenerateVariants: () => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export const AIOptimizationPanel: React.FC<AIOptimizationPanelProps> = ({
  campaign,
  aiInsights,
  onOptimize,
  onGenerateVariants,
  onNext,
  onBack,
  loading
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">AI Optimization</h2>
      </div>

      {/* AI Optimization Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-medium text-white">Smart Optimization</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Let AI analyze your campaign and suggest improvements based on market data and user behavior.
          </p>
          <button
            onClick={onOptimize}
            disabled={loading}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {loading ? 'Optimizing...' : 'Optimize with AI'}
          </button>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">A/B Test Variants</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Generate multiple campaign variants to test different approaches and maximize performance.
          </p>
          <button
            onClick={onGenerateVariants}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" />
            Generate Variants
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      {aiInsights?.suggestions && (
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">AI Recommendations</h3>
          <div className="space-y-3">
            {aiInsights.suggestions.map((suggestion: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">{suggestion.title}</h4>
                  <p className="text-gray-400 text-sm">{suggestion.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-green-400">
                      Impact: +{suggestion.expectedImprovement}%
                    </span>
                    <span className="text-xs text-blue-400">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A/B Test Variants */}
      {campaign.multiVariantTesting?.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Generated Variants</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaign.multiVariantTesting.map((variant: any, index: number) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Variant {index + 1}</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-400">
                    <span className="text-gray-300">Incentive:</span> {variant.incentive}
                  </div>
                  <div className="text-gray-400">
                    <span className="text-gray-300">Message:</span> {variant.message}
                  </div>
                  <div className="text-gray-400">
                    <span className="text-gray-300">Expected CTR:</span> {variant.expectedCTR}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
        >
          Next: Launch Campaign
        </button>
      </div>
    </div>
  );
};
