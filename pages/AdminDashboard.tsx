import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Bell, LogOut, Check, X, Shield, 
  Activity, Trash2, Ban, Plus, Settings, Briefcase, Pin, 
  Upload, Book, Camera, Image as ImageIcon, 
  Lock, Unlock, Key, Calendar, History, Save, Edit, CheckCircle,
  ChevronLeft, Star, FileUp, Link2
} from 'lucide-react';
import { api } from '../services/mockDb';
import { 
  Submission, Student, AuditLogEntry, UserRole, AdminUser, 
  Notice, Resource, Department, CampusImage, SiteConfig, CampusMemory 
} from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';

type Tab = 'overview' | 'students' | 'notices' | 'resources' | 'submissions' | 'logs' | 'team' | 'profile' | 'content' | 'memories';

const getRank = (score: number) => {
    if (score > 1000) return { name: 'Legend', color: 'bg-purple-600' };
    if (score > 500) return { name: 'Guardian', color: 'bg-red-600' };
    if (score > 100) return { name: 'Contributor', color: 'bg-blue-600' };
    return { name: 'Observer', color: 'bg-gray-500' };
};

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [campusImages, setCampusImages] = useState<CampusImage[]>([]);
  const [memories, setMemories] = useState<CampusMemory[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
      logoUrl: null,
      contact: { address: '', email: '', phone: '' }
  });
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [newUser, setNewUser] = useState({ username: '', password: '', role: UserRole.MODERATOR, fullName: '', title: '', avatarUrl: '', linkedStudentSlug: '' });
  const [profileForm, setProfileForm] = useState({ fullName: '', title: '', avatarUrl: '', linkedStudentSlug: '' });
  
  // Notice Form
  const [noticeForm, setNoticeForm] = useState<{id?: string, title: string, content: string, type: 'campus' | 'exam' | 'event' | 'course', isPinned: boolean, attachmentUrl: string}>({
      title: '', content: '', type: 'campus', isPinned: false, attachmentUrl: ''
  });
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  // Resource Form
  const [resourceForm, setResourceForm] = useState<{id?: string, title: string, authorName: string, department: Department, subject: string, type: 'note' | 'thesis' | 'paper', downloadUrl: string, intake: string}>({
      title: '', authorName: '', department: Department.MT, subject: '', type: 'note', downloadUrl: '', intake: ''
  });
  const [isEditingResource, setIsEditingResource] = useState(false);

  // Memory Form
  const [memoryForm, setMemoryForm] = useState<{id?: string, title: string, year: number, description: string, date: string, images: string[]}>({
      title: '', year: new Date().getFullYear(), description: '', date: new Date().toISOString().split('T')[0], images: []
  });
  const [isEditingMemory, setIsEditingMemory] = useState(false);

  const navigate = useNavigate();

  const refreshData = useCallback(async () => {
    try {
        const [subs, stus, logs, nots, ress, imgs, config, admins, mems] = await Promise.all([
            api.getSubmissions(), api.getStudents(), api.getAuditLogs(),
            api.getNotices(), api.getResources(), api.getCampusImages(),
            api.getSiteConfig(), api.getAdminUsers(), api.getMemories()
        ]);
        
        setSubmissions(subs || []);
        setStudents(stus || []);
        setAuditLogs(logs || []);
        setNotices(nots || []);
        setResources(ress || []);
        setCampusImages(imgs || []);
        if (config) {
          setSiteConfig({
            logoUrl: config.logoUrl || null,
            contact: config.contact || { address: '', email: '', phone: '' }
          });
        }
        setAdminUsers(admins || []);
        setMemories(mems || []);
    } catch (e) { 
        console.error("Failed to load dashboard data", e); 
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
        const token = localStorage.getItem('cc_admin_token');
        if (!token) { navigate('/admin-portal-secure'); return; }
        await api.restoreSession();
        const user = api.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            setProfileForm({ 
              fullName: user.fullName || '', 
              title: user.title || '', 
              avatarUrl: user.avatarUrl || '', 
              linkedStudentSlug: user.linkedStudentSlug || '' 
            });
            refreshData();
        } else { 
            navigate('/admin-portal-secure'); 
        }
    };
    checkAuth();
  }, [navigate, refreshData]);

  const handleLogout = () => { 
      localStorage.removeItem('cc_admin_token'); 
      navigate('/'); 
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 15 * 1024 * 1024) {
          alert("File size exceeds 15MB limit.");
          return;
      }
      const base64 = await readFileAsBase64(file);
      setter(base64);
  };

  /**
   * Automatically extracts the student slug from a pasted URL
   */
  const handleSlugInput = (value: string): string => {
    if (!value) return '';
    try {
      if (value.includes('/directory/')) {
        const parts = value.split('/directory/');
        // Handle potential hash routing and query params
        const slug = parts[parts.length - 1].split('?')[0].split('/')[0];
        return slug;
      }
      return value.trim();
    } catch (e) {
      return value;
    }
  };

  // HANDLERS
  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.updateStudent(id, { isFeatured: !current });
      refreshData();
    } catch (e) { alert("Failed to toggle status"); }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      try {
          if (isEditingNotice && noticeForm.id) {
              await api.updateNotice(noticeForm.id, noticeForm);
          } else {
              await api.createNotice({ ...noticeForm, postedAt: new Date().toISOString() });
          }
          setNoticeForm({ title: '', content: '', type: 'campus', isPinned: false, attachmentUrl: '' });
          setIsEditingNotice(false);
          refreshData();
          alert("Notice saved successfully.");
      } catch (err) { alert("Error saving notice."); } 
      finally { setActionLoading(false); }
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resourceForm.downloadUrl) return alert("Please upload a file.");
      setActionLoading(true);
      try {
          if (isEditingResource && resourceForm.id) {
              await api.deleteResource(resourceForm.id); // Simple mock update
              await api.createResource({ ...resourceForm, uploadDate: new Date().toISOString(), downloads: 0, version: 1 });
          } else {
              await api.createResource({ ...resourceForm, uploadDate: new Date().toISOString(), downloads: 0, version: 1 });
          }
          setResourceForm({ title: '', authorName: '', department: Department.MT, subject: '', type: 'note', downloadUrl: '', intake: '' });
          setIsEditingResource(false);
          refreshData();
          alert("Resource published.");
      } catch (e) { alert("Failed to save resource."); }
      finally { setActionLoading(false); }
  };

  const handleMemorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (memoryForm.images.length === 0) return alert('Add at least one photo');
      setActionLoading(true);
      try {
          if (isEditingMemory && memoryForm.id) {
              await api.updateMemory(memoryForm.id, memoryForm);
              setIsEditingMemory(false);
          } else {
              await api.createMemory(memoryForm);
          }
          setMemoryForm({ title: '', year: new Date().getFullYear(), description: '', date: new Date().toISOString().split('T')[0], images: [] });
          refreshData();
          alert('Memory saved!');
      } catch (e) { alert('Failed to save memory'); } 
      finally { setActionLoading(false); }
  };

  const handleSlideshowUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    try {
        const base64 = await readFileAsBase64(file);
        await api.uploadCampusImage(base64);
        refreshData();
        alert("Image uploaded to slideshow.");
    } catch (e) { alert("Upload failed."); }
    finally { setActionLoading(false); }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      try {
          await api.updateSiteConfig(siteConfig);
          refreshData();
          alert("Site configuration updated.");
      } catch (err) {
          alert("Failed to update site configuration.");
      } finally {
          setActionLoading(false);
      }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      try {
          await api.createAdminUser({
              ...newUser,
              activityScore: 0
          });
          setNewUser({ username: '', password: '', role: UserRole.MODERATOR, fullName: '', title: '', avatarUrl: '', linkedStudentSlug: '' });
          refreshData();
          alert("Team member added.");
      } catch (e) {
          alert("Failed to create user.");
      } finally {
          setActionLoading(false);
      }
  };

  const handleToggleLock = async (id: string) => {
      try {
          await api.toggleStudentLock(id);
          refreshData();
      } catch (e) { alert("Failed to toggle security status."); }
  };

  const handleToggleSuspend = async (id: string) => {
      try {
          await api.toggleStudentStatus(id);
          refreshData();
      } catch (e) { alert("Failed to update student status."); }
  };

  const handleReviewSubmission = async (id: string, status: 'approved' | 'rejected') => {
      setActionLoading(true);
      try {
          await api.updateSubmissionStatus(id, status);
          refreshData();
      } catch (e) { alert("Failed to process submission."); }
      finally { setActionLoading(false); }
  };

  if (!currentUser || loading) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
              <div className="text-center">
                  <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-400">Synchronizing BIMT Dashboard...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white shadow-lg z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="mr-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all active:scale-95 group"
              title="Go Back"
            >
              <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center font-bold text-xl">
              <span className={`px-2 py-1 rounded text-[10px] mr-3 uppercase font-black tracking-widest ${currentUser.role === UserRole.SUPER_ADMIN ? 'bg-red-600' : 'bg-blue-600'}`}>
                  {currentUser.role === UserRole.SUPER_ADMIN ? 'Admin' : 'Staff'}
              </span>
              BIMT CONSOLE
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center text-right mr-4">
                 <div className="mr-3 hidden sm:block">
                     <div className="text-sm font-bold">{currentUser.fullName}</div>
                     <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">{getRank(currentUser.activityScore).name}</div>
                 </div>
                 <img src={currentUser.avatarUrl} alt="" className="h-9 w-9 rounded-full border-2 border-gray-700 object-cover bg-white" />
             </div>
             <button onClick={handleLogout} className="text-gray-400 hover:text-white flex items-center text-sm border-l border-gray-700 pl-4 transition-colors">
               <LogOut className="w-4 h-4 mr-2" /> Logout
             </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-64 bg-white shadow-sm hidden md:block border-r border-gray-200 overflow-y-auto">
          <nav className="mt-5 px-3 space-y-1">
            <button onClick={() => setActiveTab('overview')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <LayoutDashboard className="mr-3 h-5 w-5" /> Overview
            </button>
            <div className="pt-4 pb-2 px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Community</div>
            <button onClick={() => setActiveTab('students')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'students' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Users className="mr-3 h-5 w-5" /> Students
            </button>
            <button onClick={() => setActiveTab('memories')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'memories' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <History className="mr-3 h-5 w-5" /> Memories
            </button>
            <button onClick={() => setActiveTab('notices')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'notices' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Bell className="mr-3 h-5 w-5" /> Notices
            </button>
            <button onClick={() => setActiveTab('resources')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'resources' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Book className="mr-3 h-5 w-5" /> Resources
            </button>
            <button onClick={() => setActiveTab('submissions')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'submissions' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <FileText className="mr-3 h-5 w-5" /> Submission {submissions.filter(s=>s.status==='pending').length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{submissions.filter(s=>s.status==='pending').length}</span>}
            </button>
            <div className="pt-4 pb-2 px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Branding</div>
            <button onClick={() => setActiveTab('content')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'content' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <ImageIcon className="mr-3 h-5 w-5" /> Branding & Slides
            </button>
            <div className="pt-4 pb-2 px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">System</div>
            {currentUser.role === UserRole.SUPER_ADMIN && (
              <button onClick={() => setActiveTab('team')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'team' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Briefcase className="mr-3 h-5 w-5" /> Staff Team
              </button>
            )}
            <button onClick={() => setActiveTab('logs')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'logs' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Activity className="mr-3 h-5 w-5" /> System Logs
            </button>
            <button onClick={() => setActiveTab('profile')} className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl w-full transition-all ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Settings className="mr-3 h-5 w-5" /> Account
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-black text-gray-900">Dashboard Overview</h1>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <button onClick={() => setActiveTab('students')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left">
                   <div className="text-blue-600 bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Users size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Students</p>
                   <p className="text-2xl font-black text-gray-900">{students.length}</p>
                </button>
                <button onClick={() => setActiveTab('memories')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left">
                   <div className="text-purple-600 bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><History size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memories</p>
                   <p className="text-2xl font-black text-gray-900">{memories.length}</p>
                </button>
                <button onClick={() => setActiveTab('resources')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left">
                   <div className="text-green-600 bg-green-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Book size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Academic Assets</p>
                   <p className="text-2xl font-black text-gray-900">{resources.length}</p>
                </button>
                <button onClick={() => setActiveTab('submissions')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left">
                   <div className="text-orange-600 bg-orange-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><FileText size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Submissions</p>
                   <p className="text-2xl font-black text-gray-900">{submissions.filter(s=>s.status==='pending').length}</p>
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Live Security Feed</h3>
                      <button onClick={()=>setActiveTab('logs')} className="text-xs text-blue-600 font-bold hover:underline">View Historical Logs</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                      {auditLogs.slice(0, 5).map(log => (
                          <div key={log.id} className="px-6 py-4 flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                                  <span className="font-bold text-gray-700 mr-2">@{log.actor}</span>
                                  <span className="text-gray-500">{log.action}: {log.target}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                      ))}
                      {auditLogs.length === 0 && <div className="px-6 py-10 text-center text-gray-400 text-sm">Waiting for system activities...</div>}
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
              <div className="space-y-6">
                  <h1 className="text-2xl font-black text-gray-900">Student Directory Control</h1>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Featured</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Batch</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Security</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <button 
                                              onClick={() => handleToggleFeatured(s.id, s.isFeatured)}
                                              className={`p-2 rounded-xl transition-all ${s.isFeatured ? 'text-yellow-500 bg-yellow-50 shadow-inner' : 'text-gray-300 hover:text-yellow-400'}`}
                                            >
                                              <Star size={18} fill={s.isFeatured ? 'currentColor' : 'none'} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 flex items-center">
                                            <img src={s.avatarUrl} className="w-10 h-10 rounded-full object-cover mr-4 ring-2 ring-gray-100" alt="" />
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{s.fullName}</div>
                                                <div className="text-[10px] text-gray-500 uppercase font-black">{s.department}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{s.intake}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleToggleLock(s.id)}
                                                className={`flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${s.isLocked ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}
                                            >
                                                {s.isLocked ? <Lock className="w-3 h-3 mr-2"/> : <Unlock className="w-3 h-3 mr-2"/>}
                                                {s.isLocked ? 'Locked' : 'Open'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleToggleSuspend(s.id)} className={`p-2 rounded-lg transition-colors mr-2 ${s.status === 'suspended' ? 'bg-red-500 text-white' : 'text-orange-500 hover:bg-orange-50'}`} title="Suspend">
                                                <Ban size={18} />
                                            </button>
                                            <button onClick={() => { if(confirm('Wipe record?')) api.deleteStudent(s.id).then(refreshData) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'memories' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-black text-gray-900">Archive Management</h1>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold mb-6 flex items-center text-gray-900">
                          {isEditingMemory ? <Edit className="mr-2 text-blue-600"/> : <Plus className="mr-2 text-blue-600"/>}
                          {isEditingMemory ? 'Edit Memory Archive' : 'Add New Campus Memory'}
                      </h3>
                      <form onSubmit={handleMemorySubmit} className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <Input label="Event Title" required value={memoryForm.title} onChange={e => setMemoryForm({...memoryForm, title: e.target.value})} />
                              <div className="grid grid-cols-2 gap-4">
                                  <Input label="Year" type="number" required value={memoryForm.year} onChange={e => setMemoryForm({...memoryForm, year: parseInt(e.target.value) || 2024})} />
                                  <Input label="Exact Date" type="date" required value={memoryForm.date} onChange={e => setMemoryForm({...memoryForm, date: e.target.value})} />
                              </div>
                          </div>
                          <textarea 
                              rows={3} 
                              className="w-full bg-gray-800 text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 border-none" 
                              placeholder="Describe this historical moment..."
                              required
                              value={memoryForm.description}
                              onChange={e => setMemoryForm({...memoryForm, description: e.target.value})}
                          />
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Memory Snapshots (Max 15MB each)</label>
                              <div className="flex flex-wrap gap-4 mb-4">
                                  {memoryForm.images.map((img, idx) => (
                                      <div key={idx} className="relative group w-20 h-20">
                                          <img src={img} className="w-full h-full object-cover rounded-xl border border-gray-200" alt="" />
                                          <button 
                                              type="button"
                                              onClick={() => setMemoryForm({...memoryForm, images: memoryForm.images.filter((_, i) => i !== idx)})}
                                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <X size={12}/>
                                          </button>
                                      </div>
                                  ))}
                                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                                      <Camera size={20} className="text-gray-300 mb-1" />
                                      <span className="text-[10px] text-gray-400 font-bold">ADD</span>
                                      <input type="file" multiple className="hidden" onChange={async (e) => {
                                          const files = Array.from(e.target.files || []) as File[];
                                          const base64s = await Promise.all(files.map(f => readFileAsBase64(f)));
                                          setMemoryForm({...memoryForm, images: [...memoryForm.images, ...base64s]});
                                      }} />
                                  </label>
                              </div>
                          </div>
                          <div className="pt-4 flex space-x-3">
                              <Button type="submit" isLoading={actionLoading} className="px-8">{isEditingMemory ? 'Update Archive' : 'Commit to History'}</Button>
                              {isEditingMemory && (
                                  <Button variant="secondary" onClick={() => { setIsEditingMemory(false); setMemoryForm({ title: '', year: 2024, description: '', date: '', images: [] }) }}>Discard Edits</Button>
                              )}
                          </div>
                      </form>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {memories.map(m => (
                          <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                              <div className="aspect-video relative">
                                  <img src={m.images[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover" alt="" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                                      <button onClick={() => { setMemoryForm(m as any); setIsEditingMemory(true); window.scrollTo(0,0); }} className="p-3 bg-white text-blue-600 rounded-xl shadow-lg hover:scale-110 transition-transform"><Edit size={20}/></button>
                                      <button onClick={() => { if(confirm('Erase memory?')) api.deleteMemory(m.id).then(refreshData) }} className="p-3 bg-white text-red-600 rounded-xl shadow-lg hover:scale-110 transition-transform"><Trash2 size={20}/></button>
                                  </div>
                              </div>
                              <div className="p-5">
                                  <div className="flex justify-between items-center mb-2">
                                      <Badge variant="info" className="text-[10px] font-black">{m.year}</Badge>
                                      <span className="text-[10px] text-gray-400 font-mono">{m.images.length} PHOTOS</span>
                                  </div>
                                  <h4 className="font-bold text-gray-900 line-clamp-1">{m.title}</h4>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'resources' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-black text-gray-900">Academic Asset Repository</h1>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold mb-6 flex items-center">
                          {isEditingResource ? <Edit size={20} className="mr-2 text-blue-600"/> : <Plus size={20} className="mr-2 text-blue-600"/>}
                          {isEditingResource ? 'Update Academic Resource' : 'Publish New Resource'}
                      </h3>
                      <form onSubmit={handleResourceSubmit} className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <Input label="Title" required value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
                              <Input label="Author / Source" required value={resourceForm.authorName} onChange={e => setResourceForm({...resourceForm, authorName: e.target.value})} />
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Dept</label>
                                      <select className="w-full bg-gray-800 text-white rounded-xl p-3 text-sm" value={resourceForm.department} onChange={e => setResourceForm({...resourceForm, department: e.target.value as any})}>
                                          <option value={Department.MT}>MT</option>
                                          <option value={Department.SBT}>SBT</option>
                                      </select>
                                  </div>
                                  <Input label="Intake" value={resourceForm.intake} onChange={e => setResourceForm({...resourceForm, intake: e.target.value})} />
                              </div>
                              <Input label="Subject Name" required value={resourceForm.subject} onChange={e => setResourceForm({...resourceForm, subject: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Resource File (PDF/DOCX Max 15MB)</label>
                              <div className="flex items-center space-x-4">
                                  <label className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                                      <FileUp size={30} className="text-gray-300 mb-2" />
                                      <span className="text-sm font-bold text-gray-500">{resourceForm.downloadUrl ? 'File Selected' : 'Choose Archive File'}</span>
                                      <input type="file" className="hidden" onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if(file) {
                                              const base64 = await readFileAsBase64(file);
                                              setResourceForm({...resourceForm, downloadUrl: base64});
                                          }
                                      }} />
                                  </label>
                              </div>
                          </div>
                          <div className="pt-4 flex space-x-3">
                              <Button type="submit" isLoading={actionLoading} className="px-8">{isEditingResource ? 'Update Resource' : 'Publish Now'}</Button>
                              {isEditingResource && (
                                  <Button variant="secondary" onClick={() => { setIsEditingResource(false); setResourceForm({ title: '', authorName: '', department: Department.MT, subject: '', type: 'note', downloadUrl: '', intake: '' }) }}>Cancel</Button>
                              )}
                          </div>
                      </form>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Name</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {resources.map(r => (
                                  <tr key={r.id}>
                                      <td className="px-6 py-4">
                                          <div className="text-sm font-bold text-gray-900">{r.title}</div>
                                          <div className="text-[10px] text-gray-400 uppercase font-black">{r.authorName}</div>
                                      </td>
                                      <td className="px-6 py-4 text-sm font-medium text-gray-600">{r.department}</td>
                                      <td className="px-6 py-4 text-sm text-gray-500">{r.subject}</td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => { setResourceForm(r as any); setIsEditingResource(true); window.scrollTo(0,0); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl mr-2"><Edit size={18}/></button>
                                          <button onClick={() => { if(confirm('Delete resource?')) api.deleteResource(r.id).then(refreshData) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={18}/></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'content' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-black text-gray-900">Console & Brand Identity</h1>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Branding Section */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-lg font-bold mb-6">Global Identity</h3>
                          <form onSubmit={handleUpdateConfig} className="space-y-6">
                              <div className="flex items-center space-x-6 mb-6">
                                  <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden">
                                      {siteConfig.logoUrl ? <img src={siteConfig.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> : <ImageIcon className="text-gray-300 w-8 h-8"/>}
                                  </div>
                                  <div className="flex-1">
                                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Platform Logo</label>
                                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, (val) => setSiteConfig({...siteConfig, logoUrl: val}))} className="text-xs w-full" />
                                  </div>
                              </div>
                              <div className="space-y-4">
                                  <Input label="Admin Email" value={siteConfig.contact?.email || ''} onChange={e => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, email: e.target.value}})} />
                                  <Input label="Helpdesk Phone" value={siteConfig.contact?.phone || ''} onChange={e => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, phone: e.target.value}})} />
                                  <Input label="Official Address" value={siteConfig.contact?.address || ''} onChange={e => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, address: e.target.value}})} />
                              </div>
                              <Button type="submit" isLoading={actionLoading} className="w-full mt-4"><Save className="w-4 h-4 mr-2" /> Submit</Button>
                          </form>
                      </div>

                      {/* Slideshow Manager */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-lg font-bold mb-6">Home Hero Slideshow</h3>
                          <div className="space-y-4">
                              <label className="w-full h-24 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all group bg-gray-50/50">
                                  <Upload className="text-gray-300 group-hover:text-blue-500 transition-colors mb-2" />
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600">Upload Slide Image</span>
                                  <input type="file" className="hidden" onChange={handleSlideshowUpload} />
                              </label>

                              <div className="grid grid-cols-2 gap-4">
                                  {campusImages.map(img => (
                                      <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 group">
                                          <img src={img.url} className="w-full h-full object-cover" alt="" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <button onClick={() => { if(confirm('Remove slide?')) api.deleteCampusImage(img.id).then(refreshData) }} className="bg-red-500 text-white p-2 rounded-lg shadow-xl hover:scale-110 transition-transform">
                                                  <Trash2 size={16}/>
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              {campusImages.length === 0 && <p className="text-center text-gray-400 text-xs py-10">No hero images uploaded.</p>}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'notices' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-black text-gray-900">Campus Notice Control</h1>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold mb-6">{isEditingNotice ? 'Modify Announcement' : 'Draft New Announcement'}</h3>
                      <form onSubmit={handleNoticeSubmit} className="space-y-4">
                          <Input label="Title" required value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} />
                          <textarea className="w-full bg-gray-800 text-white rounded-xl p-4 text-sm" rows={4} value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} placeholder="Official statement details..." />
                          <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                  <input type="checkbox" id="pin_not" checked={noticeForm.isPinned} onChange={e => setNoticeForm({...noticeForm, isPinned: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                                  <label htmlFor="pin_not" className="text-sm font-bold text-gray-700">Pin to Top</label>
                              </div>
                              <Button type="submit" isLoading={actionLoading}>Post Announcement</Button>
                          </div>
                      </form>
                  </div>
                  <div className="space-y-4">
                      {notices.map(n => (
                          <div key={n.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                              <div>
                                  <h4 className="font-bold text-gray-900">{n.title}</h4>
                                  <p className="text-xs text-gray-400">{new Date(n.postedAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex space-x-2">
                                  <button onClick={() => { setNoticeForm(n as any); setIsEditingNotice(true); window.scrollTo(0,0); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                                  <button onClick={() => api.deleteNotice(n.id).then(refreshData)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'submissions' && (
              <div className="space-y-6">
                  <h1 className="text-2xl font-black text-gray-900">Submission Pipeline</h1>
                  <div className="grid gap-4">
                      {submissions.filter(s => s.status === 'pending').map(sub => (
                          <div key={sub.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                              <div className="flex items-start justify-between">
                                  <div className="flex items-center">
                                      <div className={`p-3 rounded-xl mr-5 ${sub.type === 'resource' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                          {sub.type === 'resource' ? <Book /> : <Users />}
                                      </div>
                                      <div>
                                          <div className="flex items-center space-x-2">
                                              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{sub.type.replace('_', ' ')}</span>
                                              <span className="text-[10px] text-gray-400 font-mono">• {new Date(sub.submittedAt).toLocaleString()}</span>
                                          </div>
                                          <h4 className="text-lg font-bold text-gray-900 mt-1">{sub.studentName}</h4>
                                          <p className="text-sm text-gray-500">{sub.department} • {sub.content?.intake || 'N/A'}</p>
                                      </div>
                                  </div>
                                  <div className="flex space-x-3">
                                      <button onClick={() => handleReviewSubmission(sub.id, 'approved')} className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors">
                                          <Check className="w-4 h-4 mr-2" /> Accept
                                      </button>
                                      <button onClick={() => handleReviewSubmission(sub.id, 'rejected')} className="flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                                          <X className="w-4 h-4 mr-2" /> Dismiss
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {submissions.filter(s => s.status === 'pending').length === 0 && (
                          <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                              <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-4" />
                              <p className="text-gray-400 text-lg">Platform queue is empty.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'team' && currentUser.role === UserRole.SUPER_ADMIN && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-black text-gray-900">Staff Account Management</h1>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold mb-6">Provision New Staff Account</h3>
                      <form onSubmit={handleCreateTeamMember} className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <Input label="Staff Full Name" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
                              <Input label="Staff Title / Position" placeholder="e.g. Student Secretary" required value={newUser.title} onChange={e => setNewUser({...newUser, title: e.target.value})} />
                              <Input label="Username (Login)" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                              <Input label="Temporary Password" type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Role</label>
                                  <select 
                                      className="w-full bg-gray-800 text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 border-none"
                                      value={newUser.role}
                                      onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                                  >
                                      <option value={UserRole.MODERATOR}>Content Moderator</option>
                                      <option value={UserRole.SUPER_ADMIN}>System Administrator</option>
                                  </select>
                              </div>
                              <Input 
                                label="Linked Student Username" 
                                placeholder="Paste Profile URL or Username" 
                                value={newUser.linkedStudentSlug} 
                                onChange={e => setNewUser({...newUser, linkedStudentSlug: handleSlugInput(e.target.value)})} 
                                helperText="Paste a student profile URL to automatically extract the username."
                              />
                          </div>
                          <div className="flex justify-end">
                              <Button type="submit" isLoading={actionLoading} className="px-10">Initialize Account</Button>
                          </div>
                      </form>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin User</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {adminUsers.map(u => (
                                  <tr key={u.id}>
                                      <td className="px-6 py-4 flex items-center">
                                          <img src={u.avatarUrl || 'https://via.placeholder.com/150'} className="w-9 h-9 rounded-full object-cover mr-4" alt="" />
                                          <div>
                                              <div className="text-sm font-bold text-gray-900">{u.fullName}</div>
                                              <div className="text-xs text-gray-400">@{u.username}</div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4"><Badge variant={u.role === UserRole.SUPER_ADMIN ? 'danger' : 'info'}>{u.role}</Badge></td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center text-xs font-bold">
                                              <span className={`w-2 h-2 rounded-full mr-2 ${getRank(u.activityScore).color}`}></span>
                                              {getRank(u.activityScore).name}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          {u.id !== currentUser.id && (
                                              <button onClick={() => { if(confirm('Revoke access?')) api.deleteAdminUser(u.id).then(refreshData) }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'logs' && (
              <div className="space-y-6">
                  <h1 className="text-2xl font-black text-gray-900">Historical System Audit</h1>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Authority</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-mono text-xs">
                              {auditLogs.map(log => (
                                  <tr key={log.id}>
                                      <td className="px-6 py-4 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                      <td className="px-6 py-4 font-bold text-blue-600">@{log.actor}</td>
                                      <td className="px-6 py-4 text-gray-900">{log.action}</td>
                                      <td className="px-6 py-4 text-gray-500">{log.target}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'profile' && (
              <div className="space-y-8 max-w-2xl mx-auto">
                  <h1 className="text-2xl font-black text-gray-900">Console Profile</h1>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <div className="flex flex-col items-center mb-8">
                          <div className="relative group">
                              <img src={profileForm.avatarUrl || 'https://via.placeholder.com/150'} className="w-32 h-32 rounded-3xl object-cover ring-4 ring-gray-50" alt="" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center cursor-pointer">
                                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, (val)=>setProfileForm({...profileForm, avatarUrl: val}))} />
                                  <Camera className="text-white" />
                              </div>
                          </div>
                          <h2 className="mt-4 text-xl font-bold text-gray-900">{currentUser.fullName}</h2>
                          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">{currentUser.title}</p>
                      </div>
                      <form onSubmit={async (e)=>{
                          e.preventDefault();
                          setActionLoading(true);
                          try {
                              await api.updateAdminProfile(currentUser.id, profileForm);
                              alert("Sync complete.");
                              refreshData();
                          } catch(e){ alert("Sync failed."); }
                          finally { setActionLoading(false); }
                      }} className="space-y-5">
                          <Input label="Public Console Name" value={profileForm.fullName} onChange={e=>setProfileForm({...profileForm, fullName: e.target.value})} />
                          <Input label="Professional Designation" value={profileForm.title} onChange={e=>setProfileForm({...profileForm, title: e.target.value})} />
                          
                          <Input 
                            label="Linked Student Username" 
                            placeholder="Paste Profile URL or Username" 
                            value={profileForm.linkedStudentSlug || ''} 
                            onChange={e => setProfileForm({...profileForm, linkedStudentSlug: handleSlugInput(e.target.value)})} 
                            helperText="Paste your student profile URL to automatically extract the username."
                          />

                          <Button type="submit" isLoading={actionLoading} className="w-full mt-4">Save Identity Changes</Button>
                      </form>
                  </div>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;