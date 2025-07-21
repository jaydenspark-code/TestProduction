import React, { useState } from 'react';
import { Megaphone, Building, Globe, TrendingUp, Users, Target, BarChart, CheckCircle, DollarSign } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAdvertiserApplications } from '../../context/AdvertiserApplicationContext';
import AdvertiserDashboard from '../Dashboard/AdvertiserDashboard';

const AdvertiserApplication: React.FC = () => {
  const { user } = useAuth();
  const { addApplication } = useAdvertiserApplications();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    campaignTitle: '',
    campaignDescription: '',
    targetAudience: '',
    budgetRange: '',
    campaignDuration: '',
    campaignObjectives: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { theme } = useTheme();

  if (user?.isAdvertiser) {
    return <AdvertiserDashboard />;
  }

  const budgetRanges = [
    '$1,000 - $5,000',
    '$5,000 - $10,000',
    '$10,000 - $20,000',
    '$20,000+'
  ];

  const campaignObjectives = [
    'Brand Awareness',
    'Lead Generation',
    'User Acquisition',
    'App Downloads',
    'Website Traffic',
    'Social Media Growth',
    'Product Launch',
    'Event Promotion'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleObjectiveChange = (objective: string) => {
    setFormData(prev => ({
      ...prev,
      campaignObjectives: prev.campaignObjectives.includes(objective)
        ? prev.campaignObjectives.filter(obj => obj !== objective)
        : [...prev.campaignObjectives, objective]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      addApplication({
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        ...formData,
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Campaign submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const cardClass = theme === 'professional'
    ? 'bg-[#232936] border border-[#232936]/60 rounded-lg shadow-xl'
    : 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl';

  const buttonClass = theme === 'professional'
    ? 'w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white py-3 px-6 rounded-lg transition-all duration-200 font-medium'
    : 'w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg transition-all duration-200 font-medium';

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Campaign Submitted!</h1>
            <p className="text-white/70 mb-6">
              Thank you for your interest in advertising with EarnPro. Our team will review your campaign proposal and contact you within 2-3 business days.
            </p>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
              <h4 className="text-white font-medium mb-2">What's Next?</h4>
              <ul className="text-white/70 text-sm space-y-1 text-left">
                <li>• Campaign review by our team</li>
                <li>• Budget and targeting optimization</li>
                <li>• Campaign setup and launch</li>
                <li>• Real-time performance tracking</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'professional' ? 'bg-[#181c23]' : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'} py-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Megaphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Advertise with EarnPro</h1>
            <p className="text-white/70">Reach millions of engaged users across our global network</p>
          </div>

          <div className={`${cardClass} max-w-4xl mx-auto`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Building className="w-6 h-6 mr-2" />
                  Company Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-white/80 mb-2">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent`}
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-white/80 mb-2">
                      Contact Email *
                    </label>
                    <input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent`}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-white/80 mb-2">
                    Contact Phone
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Campaign Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Target className="w-6 h-6 mr-2" />
                  Campaign Details
                </h3>

                <div>
                  <label htmlFor="campaignTitle" className="block text-sm font-medium text-white/80 mb-2">
                    Campaign Title *
                  </label>
                  <input
                    id="campaignTitle"
                    name="campaignTitle"
                    type="text"
                    required
                    value={formData.campaignTitle}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="Your campaign title"
                  />
                </div>

                <div>
                  <label htmlFor="campaignDescription" className="block text-sm font-medium text-white/80 mb-2">
                    Campaign Description *
                  </label>
                  <textarea
                    id="campaignDescription"
                    name="campaignDescription"
                    rows={4}
                    required
                    value={formData.campaignDescription}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
                    placeholder="Describe your campaign goals, target audience, and key messages..."
                  />
                </div>

                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-white/80 mb-2">
                    Target Audience *
                  </label>
                  <input
                    id="targetAudience"
                    name="targetAudience"
                    type="text"
                    required
                    value={formData.targetAudience}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="e.g., Young professionals, Tech enthusiasts, Global audience"
                  />
                </div>
              </div>

              {/* Budget and Duration */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <DollarSign className="w-6 h-6 mr-2" />
                  Budget & Timeline
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budgetRange" className="block text-sm font-medium text-white/80 mb-2">
                      Budget Range *
                    </label>
                    <select
                      id="budgetRange"
                      name="budgetRange"
                      required
                      value={formData.budgetRange}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent appearance-none`}
                    >
                      <option value="" className="bg-gray-800 text-white">Select budget range</option>
                      {budgetRanges.map(range => (
                        <option key={range} value={range} className="bg-gray-800 text-white">
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="campaignDuration" className="block text-sm font-medium text-white/80 mb-2">
                      Campaign Duration *
                    </label>
                    <input
                      id="campaignDuration"
                      name="campaignDuration"
                      type="text"
                      required
                      value={formData.campaignDuration}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500' : 'bg-white/5 border-white/20 focus:ring-purple-500'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent`}
                      placeholder="e.g., 30 days, 3 months"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Objectives */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Campaign Objectives</h3>
                <p className="text-white/70 text-sm">Select all that apply:</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {campaignObjectives.map(objective => (
                    <label
                      key={objective}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${formData.campaignObjectives.includes(objective)
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.campaignObjectives.includes(objective)}
                        onChange={() => handleObjectiveChange(objective)}
                        className="sr-only"
                      />
                      <span className="text-sm">{objective}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Platform Benefits */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-4">Why Advertise with EarnPro?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-green-300">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">2M+ Active Users</span>
                    </div>
                    <div className="flex items-center text-green-300">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">150+ Countries</span>
                    </div>
                    <div className="flex items-center text-green-300">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">High Engagement Rates</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-green-300">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Real-time Analytics</span>
                    </div>
                    <div className="flex items-center text-green-300">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Targeted Demographics</span>
                    </div>
                    <div className="flex items-center text-green-300">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Flexible Budget Options</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={buttonClass}
              >
                {loading ? 'Submitting Campaign...' : 'Submit Campaign Proposal'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertiserApplication;