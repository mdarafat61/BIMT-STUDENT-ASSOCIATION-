
import React, { useEffect, useState } from 'react';
import { FileText, Download, Book } from 'lucide-react';
import { api } from '../services/mockDb';
import { Resource } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      const data = await api.getResources();
      setResources(data);
      setLoading(false);
    };
    fetchResources();
  }, []);

  const handleDownload = (resource: Resource) => {
    // Check if it's a Base64 data URL
    if (resource.downloadUrl.startsWith('data:')) {
         const link = document.createElement('a');
         link.href = resource.downloadUrl;
         // Attempt to guess extension from MIME type
         const mime = resource.downloadUrl.split(';')[0].split(':')[1];
         let ext = 'file';
         if (mime.includes('pdf')) ext = 'pdf';
         else if (mime.includes('image')) ext = mime.split('/')[1];
         
         link.download = `${resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
    } else {
         // Fallback for external links (if any)
         window.open(resource.downloadUrl, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Academic Resources</h1>
        <p className="mt-2 text-gray-600">Access lecture notes, thesis papers, and project documentation.</p>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading resources...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {resources.map((resource) => (
              <li key={resource.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                         <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                           {resource.type === 'thesis' ? <Book className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                         </div>
                      </div>
                      <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                          <p className="text-sm font-medium text-blue-600 truncate">{resource.title}</p>
                          <p className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="truncate">{resource.authorName}</span>
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <div className="flex items-center text-sm text-gray-500">
                             <Badge variant="neutral" className="mr-2">{resource.department}</Badge>
                             <span className="truncate">{resource.subject}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="hidden sm:flex flex-col items-end text-xs text-gray-500">
                        <span>Ver. {resource.version}</span>
                        <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="ml-4"
                        onClick={() => handleDownload(resource)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {resources.length === 0 && <li className="p-8 text-center text-gray-500">No resources available yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Resources;
