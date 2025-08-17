import React, { useState } from 'react';
import { Building, Mail, Phone, Lock, Bell } from 'lucide-react';

const BusinessSettings = () => {
  const [settings, setSettings] = useState({
    companyName: 'Stark Industries',
    email: 'contact@stark.com',
    phone: '123-456-7890',
    password: '',
    notifications: true,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Updated settings:', settings);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Business Settings</h2>
      <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="block text-white font-medium mb-2">Company Name</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="companyName" value={settings.companyName} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white" />
            </div>
          </div>
          <div className="form-group">
            <label className="block text-white font-medium mb-2">Contact Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" name="email" value={settings.email} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white" />
            </div>
          </div>
          <div className="form-group">
            <label className="block text-white font-medium mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" name="phone" value={settings.phone} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white" />
            </div>
          </div>
          <div className="form-group">
            <label className="block text-white font-medium mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" name="password" placeholder="Leave blank to keep current" onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white" />
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Notifications</h3>
            <div className="space-y-4">
                <div className="flex items-center">
                    <input type="checkbox" id="notifications" name="notifications" checked={settings.notifications} onChange={handleInputChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                    <label htmlFor="notifications" className="ml-2 text-white">Receive email notifications for campaign updates</label>
                </div>
                
                <div className="flex items-center">
                    <input type="checkbox" id="campaignStatusNotifications" name="campaignStatusNotifications" checked={settings.campaignStatusNotifications || true} onChange={handleInputChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                    <label htmlFor="campaignStatusNotifications" className="ml-2 text-white">Real-time campaign status notifications</label>
                </div>
                
                <div className="flex items-center">
                    <input type="checkbox" id="performanceAlerts" name="performanceAlerts" checked={settings.performanceAlerts || true} onChange={handleInputChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                    <label htmlFor="performanceAlerts" className="ml-2 text-white">Campaign performance alerts</label>
                </div>
                
                <div className="flex items-center">
                    <input type="checkbox" id="budgetAlerts" name="budgetAlerts" checked={settings.budgetAlerts || true} onChange={handleInputChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                    <label htmlFor="budgetAlerts" className="ml-2 text-white">Budget threshold alerts (80% spent)</label>
                </div>
            </div>
        </div>
        <div className="mt-8 text-right">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
