
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, User, ClipboardList, School, History } from 'lucide-react';
import { api } from '../services/mockDb';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: School },
    { name: 'Directory', path: '/directory', icon: User },
    { name: 'Memories', path: '/memories', icon: History },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'Notices', path: '/notices', icon: ClipboardList },
    { name: 'Submit', path: '/submit', icon: null },
  ];

  useEffect(() => {
    const fetchLogo = async () => {
        try {
            const config = await api.getSiteConfig();
            setLogoUrl(config.logoUrl);
        } catch (e) {
            console.error("Failed to load site config");
        }
    };
    fetchLogo();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  if (location.pathname.startsWith('/admin-portal-secure')) return null;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              {logoUrl ? (
                  <img src={logoUrl} alt="BIMT Logo" className="h-10 w-auto mr-3 rounded" />
              ) : (
                  <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xl">B</span>
                  </div>
              )}
              <div className="flex flex-col justify-center">
                <span className="font-bold text-lg text-gray-900 leading-none">BIMT</span>
                <span className="text-xs text-blue-600 font-semibold tracking-wide">STUDENT ASSOCIATION</span>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-blue-900 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-800 hover:bg-gray-50'
                }`}
              >
                {link.icon && <link.icon size={16} className="mr-1.5" />}
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-blue-900 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  {link.icon && <link.icon size={18} className="mr-3" />}
                  {link.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
