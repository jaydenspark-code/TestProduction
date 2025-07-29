import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Welcome to EarnPro</h1>
          <p className="text-xl mb-8">Multi-Level Referral Rewards Platform</p>
          <div className="space-x-4">
            <Link to="/register" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Get Started
            </Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
