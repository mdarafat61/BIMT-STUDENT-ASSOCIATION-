import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the back button on the Home page to keep the hero section clean
  if (location.pathname === '/' || location.pathname === '/admin-portal-secure') {
    return null;
  }

  return (
    <div className="w-full bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow transition-all duration-200 group active:scale-95"
          aria-label="Go back to previous page"
        >
          <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back
        </button>
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow flex flex-col">
        <BackButton />
        <main className="flex-grow">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;