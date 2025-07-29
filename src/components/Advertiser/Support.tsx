import React from 'react';
import { HelpCircle, MessageSquare, BookOpen } from 'lucide-react';

const Support = () => {
  const faqs = [
    { q: 'How do I create a campaign?', a: 'Navigate to the "Create Campaign" tab and follow the on-screen instructions.' },
    { q: 'What are the available payment methods?', a: 'We accept all major credit cards and bank transfers.' },
    { q: 'How can I track my campaign performance?', a: 'The "Performance Analytics" tab provides detailed insights into your campaigns.' },
    { q: 'Can I target a specific audience?', a: 'Yes, during campaign creation, you can specify your target audience demographics.' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Support</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center"><MessageSquare className="mr-2" /> Contact Support</h3>
          <p className="text-gray-400 mb-4">Have a question? Our support team is here to help.</p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">Contact Us</button>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center"><BookOpen className="mr-2" /> Knowledge Base</h3>
          <p className="text-gray-400 mb-4">Browse our articles and tutorials for quick answers.</p>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg">Visit Knowledge Base</button>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center"><HelpCircle className="mr-2" /> Frequently Asked Questions</h3>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white">{faq.q}</h4>
              <p className="text-gray-400 mt-2">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Support;
