import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Mail, Phone, MapPin } from 'lucide-react';
import EarnProLogo from '../Logo/EarnProLogo';

const Footer: React.FC = () => {
  const { theme } = useTheme();

  // Use the same gradient as Legal page in light mode, and same solid as dark mode
  const footerBgClass = theme === 'professional'
    ? 'bg-[#181c23]'
    : 'bg-gradient-to-br from-[#6a4bff] to-[#2563eb]';

  const footerClass = `${footerBgClass} mt-16`;

  const linkClass = theme === 'professional'
    ? 'text-white/60 hover:text-cyan-400 transition-colors'
    : 'text-white/60 hover:text-purple-200 transition-colors';

  const gradientClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-400 to-blue-400'
    : 'bg-gradient-to-r from-purple-400 to-blue-400';

  return (
    <footer className={footerClass}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <EarnProLogo size={32} />
              <span className={`text-xl font-bold ${gradientClass} bg-clip-text text-transparent`}>
                EarnPro
              </span>
            </Link>
            <p className="text-white/60 text-sm">
              The world's most trusted referral rewards platform. Join millions of users earning through our global network.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className={linkClass}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/agent" className={linkClass}>
                  Agent Program
                </Link>
              </li>
              <li>
                <Link to="/advertiser" className={linkClass}>
                  Advertiser Portal
                </Link>
              </li>
              <li>
                <Link to="/legal" className={linkClass}>
                  Legal & Guidance
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/legal" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/legal" className={linkClass}>
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-white/60">
                <Mail className="w-4 h-4" />
                <span>support@earnpro.com</span>
              </div>
              <div className="flex items-center space-x-2 text-white/60">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-white/60">
                <MapPin className="w-4 h-4" />
                <span>Global Operations</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t ${theme === 'professional' ? 'border-gray-700/50' : 'border-white/20'} mt-8 pt-8 text-center text-sm text-white/60`}>
          <p>&copy; 2025 EarnPro. All rights reserved. Operating globally with secure, compliant referral systems.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;