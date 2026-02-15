import React, { useEffect, useState } from 'react';
import { FileText, Download, BookOpen, AlertCircle, Search } from 'lucide-react';
import { api } from '../services/mockDb';
import { Resource } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const data = await api.getResources();
        // Ensure data is an array
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch resources", err);
        setError("Unable to load resources. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const handleDownload = (resource: Resource) => {
    if (!resource?.downloadUrl) {
      alert("Download link is missing for this resource.");
      return;
    }

    try {
      if (resource.downloadUrl.startsWith('data:')) {
           const link = document.createElement('a');
           link.href = resource.downloadUrl;
           const mimeMatch = resource.downloadUrl.match(/:(.*?);/);
           const mime = mimeMatch ? mimeMatch[1] : '';
           
           let ext = 'file';
           if (mime.includes('pdf')) ext = 'pdf';
           else if (mime.includes('image')) ext = mime.split('/')[1] || 'jpg';
           else if (mime.includes('word')) ext = 'docx';
           
           link.download = `${(resource.title || 'resource').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
      } else {
           window.open(resource.downloadUrl, '_blank');
      }
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to initiate download.");
    }
  };

  const filteredResources = (resources || []).filter(r => 
    r?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r?.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Academic Archive...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Resources</h1>
          <p className="mt-2 text-gray-600">Access verified lecture notes, thesis papers, and project materials.</p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter by title, subject..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
        {filteredResources.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {filteredResources.map((resource) => (
              <li key={resource.id} className="group hover:bg-gray-50/50 transition-colors">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0">
                       <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                         {resource.type === 'thesis' ? <BookOpen className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                       </div>
                    </div>
                    <div className="min-w-0 flex-1 px-6 grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <div>
                        <p className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{resource.title}</p>
                        <p className="text-sm text-gray-500 flex items-center mt-0.5">
                          <span className="font-medium">{resource.authorName}</span>
                        </p>
                      </div>
                      <div className="hidden lg:flex items-center space-x-3">
                         <Badge variant="neutral" className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-widest">{resource.department}</Badge>
                         <span className="text-sm text-gray-400 font-medium truncate">Subject: {resource.subject}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 ml-4">
                    <div className="hidden sm:flex flex-col items-end text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span className="text-gray-900">v{resource.version || 1.0}</span>
                      <span className="mt-1">{resource.uploadDate ? new Date(resource.uploadDate).toLocaleDateString() : 'Unknown Date'}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl font-bold shadow-none group-hover:border-blue-200 group-hover:bg-white"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Get File
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-gray-300 w-8 h-8" />
            </div>
            <p className="text-gray-500 font-medium">No resources found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;