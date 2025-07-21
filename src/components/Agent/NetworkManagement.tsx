
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Network, Users, UserPlus, TrendingUp, Search, Filter, MoreVertical, Star, Award, Shield } from 'lucide-react';

const NetworkManagement: React.FC = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const networkMembers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      joinDate: '2024-01-15',
      referrals: 45,
      earnings: 2340.50,
      status: 'active',
      level: 'gold',
      country: 'US'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael@example.com',
      joinDate: '2024-01-20',
      referrals: 32,
      earnings: 1890.25,
      status: 'active',
      level: 'silver',
      country: 'CA'
    },
    {
      id: 3,
      name: 'Emma Williams',
      email: 'emma@example.com',
      joinDate: '2024-02-01',
      referrals: 28,
      earnings: 1456.75,
      status: 'pending',
      level: 'bronze',
      country: 'GB'
    },
    {
      id: 4,
      name: 'David Rodriguez',
      email: 'david@example.com',
      joinDate: '2024-02-10',
      referrals: 19,
      earnings: 987.50,
      status: 'active',
      level: 'bronze',
      country: 'ES'
    }
  ];

  const filteredMembers = networkMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || member.status === filterType || member.level === filterType;
    return matchesSearch && matchesFilter;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'gold': return <Award className="w-4 h-4 text-yellow-400" />;
      case 'silver': return <Star className="w-4 h-4 text-gray-400" />;
      case 'bronze': return <Shield className="w-4 h-4 text-amber-600" />;
      default: return <Users className="w-4 h-4 text-white/60" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-300';
      case 'pending': return 'text-yellow-300';
      case 'inactive': return 'text-red-300';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <Network className="w-8 h-8 mr-3 text-blue-400" />
          Network Management
        </h3>
        <button className={`px-4 py-2 ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'} rounded-lg text-white hover:bg-white/20 transition-all duration-200 flex items-center space-x-2`}>
          <UserPlus className="w-4 h-4" />
          <span>Invite Members</span>
        </button>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">2,847</span>
          </div>
          <h4 className="text-white font-medium">Total Members</h4>
          <p className="text-green-300 text-sm">+145 this month</p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-white">2,456</span>
          </div>
          <h4 className="text-white font-medium">Active Members</h4>
          <p className="text-green-300 text-sm">86.3% active rate</p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">234</span>
          </div>
          <h4 className="text-white font-medium">Top Performers</h4>
          <p className="text-yellow-300 text-sm">Gold level agents</p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <UserPlus className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">45</span>
          </div>
          <h4 className="text-white font-medium">New This Week</h4>
          <p className="text-purple-300 text-sm">+23% vs last week</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`${cardClass} p-6`}>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'} rounded-lg text-white placeholder-white/60 border ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'}`}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-white/60 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-2 ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'} rounded-lg text-white border ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'}`}
            >
              <option value="all">All Members</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="gold">Gold Level</option>
              <option value="silver">Silver Level</option>
              <option value="bronze">Bronze Level</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} border-b`}>
                <th className="text-left text-white/70 pb-3">Member</th>
                <th className="text-left text-white/70 pb-3">Level</th>
                <th className="text-left text-white/70 pb-3">Referrals</th>
                <th className="text-left text-white/70 pb-3">Earnings</th>
                <th className="text-left text-white/70 pb-3">Status</th>
                <th className="text-left text-white/70 pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className={`${theme === 'professional' ? 'border-gray-600/20' : 'border-white/5'} border-b hover:bg-white/5 transition-all duration-200`}>
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        member.level === 'gold' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                        member.level === 'silver' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        'bg-gradient-to-br from-amber-600 to-yellow-700'
                      }`}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-white font-medium">{member.name}</div>
                        <div className="text-white/60 text-sm">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      {getLevelIcon(member.level)}
                      <span className="text-white capitalize">{member.level}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-white font-medium">{member.referrals}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-green-300 font-medium">${member.earnings.toFixed(2)}</span>
                  </td>
                  <td className="py-4">
                    <span className={`capitalize ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <button className="text-white/60 hover:text-white transition-colors duration-200">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NetworkManagement;
