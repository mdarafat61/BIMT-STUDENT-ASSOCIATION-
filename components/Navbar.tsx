import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, User, ClipboardList, School, History, Shield, ChevronDown, LayoutGrid } from 'lucide-react';
import { api } from '../services/mockDb';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const location = useLocation();
  const hubRef = useRef<HTMLDivElement>(null);

  const hubLinks = [
    { name: 'Campus Memories', path: '/memories', icon: History, desc: 'Relive our history' },
    { name: 'Academic Resources', path: '/resources', icon: BookOpen, desc: 'Study materials & notes' },
    { name: 'Notice Board', path: '/notices', icon: ClipboardList, desc: 'Latest announcements' },
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(event.target as Node)) {
        setIsHubOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isHubActive = hubLinks.some(link => location.pathname === link.path);

  if (location.pathname.startsWith('/admin-portal-secure')) return null;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              {logoUrl ? (
                  <img src={logoUrl} alt="BIMT Logo" className="h-12 w-auto mr-3 rounded transition-transform group-hover:scale-105" />
              ) : (
                  <div className="relative flex items-center justify-center mr-4 flex-shrink-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg rotate-[15deg] absolute opacity-10 group-hover:rotate-45 transition-transform duration-700"></div>
                    <div className="w-11 h-11 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg relative transform group-hover:-rotate-6 transition-transform overflow-hidden">
                      <Shield className="text-blue-400/20 absolute w-8 h-8 -bottom-1 -right-1" />
                      <span className="text-white font-black text-2xl tracking-tighter select-none">B</span>
                    </div>
                  </div>
              )}
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-black text-2xl text-gray-900 leading-none tracking-tight group-hover:text-blue-900 transition-colors truncate">
                  BIMT
                </span>
                <span className="hidden md:block text-[10px] text-blue-600 font-bold tracking-[0.2em] uppercase mt-1 opacity-80">
                  Student Association
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {/* Primary Links */}
            <Link to="/" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive('/') ? 'text-blue-900 bg-blue-50 shadow-sm' : 'text-gray-600 hover:text-blue-900 hover:bg-gray-50'}`}>
                Home
            </Link>
            <Link to="/directory" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive('/directory') ? 'text-blue-900 bg-blue-50 shadow-sm' : 'text-gray-600 hover:text-blue-900 hover:bg-gray-50'}`}>
                Directory
            </Link>

            {/* Combined Hub Dropdown */}
            <div className="relative" ref={hubRef}>
              <button
                onMouseEnter={() => setIsHubOpen(true)}
                onClick={() => setIsHubOpen(!isHubOpen)}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all group ${
                  isHubActive ? 'text-blue-900 bg-blue-50 shadow-sm' : 'text-gray-600 hover:text-blue-900 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid size={16} className="mr-2 opacity-70" />
                Campus Hub
                <ChevronDown size={14} className={`ml-1.5 transition-transform duration-300 ${isHubOpen ? 'rotate-180' : ''}`} />
              </button>

              {isHubOpen && (
                <div 
                  className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in zoom-in-95 duration-200"
                  onMouseLeave={() => setIsHubOpen(false)}
                >
                  <div className="px-4 py-2 mb-2 border-b border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigation & Resources</p>
                  </div>
                  {hubLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsHubOpen(false)}
                      className={`flex items-center px-4 py-3 mx-2 rounded-xl transition-colors ${
                        isActive(link.path) ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-900'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-4 ${isActive(link.path) ? 'bg-blue-100' : 'bg-gray-50'}`}>
                        <link.icon size={18} className={isActive(link.path) ? 'text-blue-600' : 'text-gray-500'} />
                      </div>
                      <div>
                        <div className="text-sm font-bold leading-tight">{link.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{link.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/submit" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive('/submit') ? 'text-blue-900 bg-blue-50 shadow-sm' : 'text-gray-600 hover:text-blue-900 hover:bg-gray-50'}`}>
                Submit
            </Link>
          </div>

          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-gray-600 hover:text-blue-900 hover:bg-blue-50 focus:outline-none transition-colors border border-transparent active:scale-95"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
          <div className="pt-2 pb-6 space-y-1 px-4">
            <Link to="/" onClick={() => setIsOpen(false)} className={`flex items-center px-4 py-3.5 rounded-xl text-base font-bold transition-all ${isActive('/') ? 'text-blue-900 bg-blue-50' : 'text-gray-600'}`}>
              <School size={20} className="mr-4 text-blue-600" /> Home
            </Link>
            <Link to="/directory" onClick={() => setIsOpen(false)} className={`flex items-center px-4 py-3.5 rounded-xl text-base font-bold transition-all ${isActive('/directory') ? 'text-blue-900 bg-blue-50' : 'text-gray-600'}`}>
              <User size={20} className="mr-4 text-blue-600" /> Directory
            </Link>

            {/* Mobile Hub Accordion */}
            <div className="py-2">
                <div className="px-4 py-2 mb-1 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Campus Hub</span>
                </div>
                <div className="ml-4 space-y-1">
                    {hubLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-xl text-base font-bold transition-all ${
                                isActive(link.path) ? 'text-blue-900 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <link.icon size={20} className="mr-4 opacity-70" /> {link.name}
                        </Link>
                    ))}
                </div>
            </div>

            <Link to="/submit" onClick={() => setIsOpen(false)} className={`flex items-center px-4 py-3.5 rounded-xl text-base font-bold transition-all ${isActive('/submit') ? 'text-blue-900 bg-blue-50' : 'text-gray-600'}`}>
               <span className="w-5 mr-4" /> Submit
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;