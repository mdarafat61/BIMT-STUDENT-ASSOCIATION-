
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/mockDb';

const Footer: React.FC = () => {
  const location = useLocation();
  const [contactInfo, setContactInfo] = useState({
      address: 'BIMT Campus, Knowledge Park, KP-101',
      email: 'sa@bimt.edu.vn',
      phone: '+84 (555) 123-4567'
  });

  useEffect(() => {
    const fetchContact = async () => {
        try {
            const config = await api.getSiteConfig();
            if (config.contact) {
                setContactInfo(config.contact);
            }
        } catch(e) {
            console.error("Failed to load footer config");
        }
    };
    fetchContact();
  }, []);

  if (location.pathname.startsWith('/admin-portal-secure')) return null;

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">BIMT Student Association</h3>
            <p className="text-gray-400 max-w-sm">
              The official community platform for students, faculty, and alumni. 
              Connecting minds, sharing knowledge, and building the future together.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/directory" className="hover:text-white transition">Student Directory</Link></li>
              <li><Link to="/resources" className="hover:text-white transition">Academic Resources</Link></li>
              <li><Link to="/notices" className="hover:text-white transition">Notice Board</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>{contactInfo.address}</li>
              <li>{contactInfo.email}</li>
              <li>{contactInfo.phone}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} BIMT Student Association. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
             <Link to="/admin-portal-secure" className="opacity-50 hover:opacity-100 hover:text-blue-400 transition-all flex items-center gap-1">
                Admin Panel (Restricted)
             </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
