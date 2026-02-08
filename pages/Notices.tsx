
import React, { useEffect, useState } from 'react';
import { Pin, Calendar, AlertCircle, Download } from 'lucide-react';
import { api } from '../services/mockDb';
import { Notice } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      const data = await api.getNotices();
      setNotices(data);
      setLoading(false);
    };
    fetchNotices();
  }, []);

  const handleDownload = (notice: Notice) => {
    if (notice.attachmentUrl) {
         const link = document.createElement('a');
         link.href = notice.attachmentUrl;
         // Simple mime check for extension
         const mime = notice.attachmentUrl.split(';')[0].split(':')[1];
         let ext = 'file';
         if (mime.includes('pdf')) ext = 'pdf';
         else if (mime.includes('image')) ext = 'png'; // default to png if image
         else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
         
         link.download = `${notice.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Campus Notice Board</h1>
        <p className="mt-2 text-gray-600">Stay updated with the latest announcements, schedules, and events.</p>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading notices...</div>
      ) : (
        <div className="space-y-6">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`bg-white rounded-lg p-6 border transition-shadow hover:shadow-md ${
                notice.isPinned ? 'border-l-4 border-l-blue-600 border-gray-200 shadow-sm' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {notice.isPinned && (
                      <span className="flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        <Pin className="w-3 h-3 mr-1" /> Pinned
                      </span>
                    )}
                    <Badge variant={
                      notice.type === 'exam' ? 'danger' : 
                      notice.type === 'campus' ? 'warning' : 
                      notice.type === 'event' ? 'info' : 'success'
                    }>
                      {notice.type.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{notice.title}</h3>
                  <div className="prose prose-sm text-gray-600 max-w-none">
                    <p className="whitespace-pre-wrap">{notice.content}</p>
                  </div>
                  
                  {notice.attachmentUrl && (
                      <div className="mt-4">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(notice)}>
                            <Download className="w-4 h-4 mr-2" /> Download Attachment
                        </Button>
                      </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500 border-t pt-4">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Posted on {new Date(notice.postedAt).toLocaleDateString()}</span>
                {notice.expiresAt && (
                   <span className="ml-4 flex items-center text-red-500">
                     <AlertCircle className="w-4 h-4 mr-1" /> Expires: {new Date(notice.expiresAt).toLocaleDateString()}
                   </span>
                )}
              </div>
            </div>
          ))}

          {notices.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
              <p className="text-gray-500">No notices available at this time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notices;
