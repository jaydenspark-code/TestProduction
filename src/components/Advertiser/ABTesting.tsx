import React, { useState } from 'react';
import { SplitSquareVertical, BarChart2, ArrowRight, Plus, Trash2 } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  description: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  };
}

const ABTesting: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: 'A',
      name: 'Original',
      description: 'Current campaign creative and targeting',
      metrics: {
        impressions: 10000,
        clicks: 300,
        conversions: 25,
        ctr: 3.0,
        conversionRate: 8.33
      }
    },
    {
      id: 'B',
      name: 'Test Variant',
      description: 'New creative with emotional appeal',
      metrics: {
        impressions: 10000,
        clicks: 350,
        conversions: 32,
        ctr: 3.5,
        conversionRate: 9.14
      }
    }
  ]);

  const [newVariant, setNewVariant] = useState({
    name: '',
    description: ''
  });

  const handleAddVariant = () => {
    if (newVariant.name && newVariant.description) {
      const variant: Variant = {
        id: String.fromCharCode(65 + variants.length), // A, B, C, etc.
        name: newVariant.name,
        description: newVariant.description,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0
        }
      };
      setVariants([...variants, variant]);
      setNewVariant({ name: '', description: '' });
    }
  };

  const handleDeleteVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <SplitSquareVertical className="w-6 h-6 text-purple-400" />
          A/B Testing
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {variants.map((variant) => (
          <div key={variant.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  Variant {variant.id}: {variant.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{variant.description}</p>
              </div>
              {variant.id !== 'A' && (
                <button
                  onClick={() => handleDeleteVariant(variant.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Impressions</span>
                <span className="text-white font-medium">{variant.metrics.impressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Clicks</span>
                <span className="text-white font-medium">{variant.metrics.clicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Conversions</span>
                <span className="text-white font-medium">{variant.metrics.conversions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">CTR</span>
                <span className="text-white font-medium">{variant.metrics.ctr.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Conversion Rate</span>
                <span className="text-white font-medium">{variant.metrics.conversionRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Variant
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Variant Name</label>
            <input
              type="text"
              value={newVariant.name}
              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
              className="w-full bg-gray-700/30 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter variant name"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Description</label>
            <input
              type="text"
              value={newVariant.description}
              onChange={(e) => setNewVariant({ ...newVariant, description: e.target.value })}
              className="w-full bg-gray-700/30 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter variant description"
            />
          </div>
          <button
            onClick={handleAddVariant}
            disabled={!newVariant.name || !newVariant.description}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Variant
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          Test Results
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Leading Variant</h4>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-400">B</span>
                <ArrowRight className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">9.14% conversion rate</span>
              </div>
            </div>
            <div className="flex-1 bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Improvement</h4>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-400">+9.7%</span>
                <span className="text-gray-400">over original</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABTesting;