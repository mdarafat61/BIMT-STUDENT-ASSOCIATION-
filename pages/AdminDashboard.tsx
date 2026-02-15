
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Bell, LogOut, Check, X, Shield, Activity, Trash2, Ban, Plus, Settings, Briefcase, Pin, PinOff, Upload, Book, File, Camera, Image as ImageIcon, Globe, Phone, Mail, MapPin, Lock, Unlock, Key, Calendar, History } from 'lucide-react';
import { api } from '../services/mockDb';
import { Submission, Student, AuditLogEntry, UserRole, AdminUser, Notice, Resource, Department, CampusImage, SiteConfig, CampusMemory } from '../types';
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
  const [stats, setStats] = useState({ pending: 0, totalStudents: 0 });

  // Forms
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'moderator', fullName: '', title: '', avatarUrl: '' });
  const [profileForm, setProfileForm] = useState({ fullName: '', title: '', avatarUrl: '', linkedStudentSlug: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  
  // Notice Form
  const [noticeForm, setNoticeForm] = useState<{id?: string, title: string, content: string, type: 'campus' | 'exam' | 'event' | 'course', isPinned: boolean, attachmentUrl: string}>({
      title: '', content: '', type: 'campus', isPinned: true, attachmentUrl: ''
  });
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  // Memory Form
  const [memoryForm, setMemoryForm] = useState<{id?: string, title: string, year: number, description: string, date: string, images: string[]}>({
      title: '', year: new Date().getFullYear(), description: '', date: new Date().toISOString().split('T')[0], images: []
  });
  const [isEditingMemory, setIsEditingMemory] = useState(false);

  // Resource Form
  const [resourceForm, setResourceForm] = useState<{title: string, department: Department, subject: string, type: 'note' | 'thesis' | 'paper', fileBase64: string}>({
      title: '', department: Department.MT, subject: '', type: 'note', fileBase64: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
        const token = localStorage.getItem('cc_admin_token');
        if (!token) { navigate('/admin-portal-secure'); return; }
        await api.restoreSession();
        const user = api.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            setProfileForm({ fullName: user.fullName, title: user.title, avatarUrl: user.avatarUrl, linkedStudentSlug: user.linkedStudentSlug || '' });
        } else { navigate('/admin-portal-secure'); }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
      if(currentUser) refreshData();
  }, [currentUser, activeTab]);

  const refreshData = async () => {
    try {
        const [subs, stus, logs, nots, ress, imgs, config, admins, mems] = await Promise.all([
            api.getSubmissions(), api.getStudents(), api.getAuditLogs(),
            api.getNotices(), api.getResources(), api.getCampusImages(),
            api.getSiteConfig(), api.getAdminUsers(), api.getMemories()
        ]);
        
        setSubmissions(subs); setStudents(stus); setAuditLogs(logs); setNotices(nots);
        setResources(ress); setCampusImages(imgs); if(config) setSiteConfig(config);
        setAdminUsers(admins); setMemories(mems);
        
        setStats({ pending: subs.filter(s => s.status === 'pending').length, totalStudents: stus.length });
    } catch (e) { console.error("Failed to load data", e); }
  };

  const handleLogout = () => { localStorage.removeItem('cc_admin_token'); navigate('/'); };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Memory Handlers
  const handleMemoryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      
      const newImages = [...memoryForm.images];
      for (let i = 0; i < files.length; i++) {
          if (newImages.length >= 15) break;
          const file = files[i];
          if (file.size > 15 * 1024 * 1024) {
              alert(`File ${file.name} exceeds 15MB limit.`);
              continue;
          }
          const base64 = await readFileAsBase64(file);
          newImages.push(base64);
      }
      setMemoryForm({ ...memoryForm, images: newImages });
      e.target.value = '';
  };

  const handleMemorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (memoryForm.images.length === 0) return alert('Add at least one photo');
      
      try {
          if (isEditingMemory && memoryForm.id) {
              await api.updateMemory(memoryForm.id, memoryForm);
              setIsEditingMemory(false);
          } else {
              await api.createMemory(memoryForm);
          }
          setMemoryForm({ title: '', year: new Date().getFullYear(), description: '', date: new Date().toISOString().split('T')[0], images: [] });
          refreshData();
          alert('Memory saved successfully!');
      } catch (e) { alert('Failed to save memory'); }
  };

  const handleEditMemory = (m: CampusMemory) => {
      setMemoryForm({ id: m.id, title: m.title, year: m.year, description: m.description, date: m.date, images: m.images });
      setIsEditingMemory(true);
      window.scrollTo(0, 0);
  };

  const handleDeleteMemory = async (id: string) => {
      if(window.confirm('Delete this memory permanently?')) {
          await api.deleteMemory(id);
          refreshData();
      }
  };

  // ... (Previous handlers remain same)
  const handleToggleLock = async (id: string) => {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, isLocked: !s.isLocked } : s));
      try { await api.toggleStudentLock(id); } catch (e) {
          setStudents(prev => prev.map(s => s.id === id ? { ...s, isLocked: !s.isLocked } : s));
      }
  }

  const handleToggleSuspend = async (id: string) => {
      const s = students.find(x => x.id === id);
      if (!s) return;
      const newStatus = s.status === 'suspended' ? 'active' : 'suspended';
      setStudents(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      try { await api.toggleStudentStatus(id); } catch (e) {
          setStudents(prev => prev.map(item => item.id === id ? { ...item, status: s.status } : item));
      }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white shadow-lg z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center font-bold text-xl">
            <span className={`px-2 py-1 rounded text-xs mr-3 uppercase ${currentUser.role === UserRole.SUPER_ADMIN ? 'bg-red-600' : 'bg-blue-600'}`}>
                {currentUser.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Moderator'}
            </span>
            BIMT Admin
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center text-right mr-4">
                 <div className="mr-3 hidden sm:block">
                     <div className="text-sm font-medium">{currentUser.fullName}</div>
                     <div className="text-xs text-gray-400">{getRank(currentUser.activityScore).name}</div>
                 </div>
                 <img src={currentUser.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-gray-600 object-cover" />
             </div>
             <button onClick={handleLogout} className="text-gray-400 hover:text-white flex items-center text-sm border-l border-gray-700 pl-4">
               <LogOut className="w-4 h-4 mr-1" /> Logout
             </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-64 bg-white shadow-sm hidden md:block border-r border-gray-200 overflow-y-auto">
          <nav className="mt-5 px-2 space-y-1">
            <button onClick={() => setActiveTab('overview')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <LayoutDashboard className="mr-3 h-5 w-5" /> Overview
            </button>
            <button onClick={() => setActiveTab('students')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Users className="mr-3 h-5 w-5" /> Manage Students
            </button>
            <button onClick={() => setActiveTab('memories')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'memories' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <History className="mr-3 h-5 w-5" /> Campus Memories
            </button>
            <button onClick={() => setActiveTab('notices')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'notices' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Bell className="mr-3 h-5 w-5" /> Notices
            </button>
            <button onClick={() => setActiveTab('resources')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'resources' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Book className="mr-3 h-5 w-5" /> Resources
            </button>
            <button onClick={() => setActiveTab('submissions')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'submissions' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <FileText className="mr-3 h-5 w-5" /> Submissions
            </button>
            <button onClick={() => setActiveTab('content')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'content' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <ImageIcon className="mr-3 h-5 w-5" /> Site Content
            </button>
            {currentUser.role === UserRole.SUPER_ADMIN && (
              <button onClick={() => setActiveTab('team')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'team' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Briefcase className="mr-3 h-5 w-5" /> Team Management
              </button>
            )}
            <button onClick={() => setActiveTab('logs')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'logs' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Activity className="mr-3 h-5 w-5" /> Audit Logs
            </button>
            <button onClick={() => setActiveTab('profile')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Settings className="mr-3 h-5 w-5" /> My Profile
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* CAMPUS MEMORIES TAB */}
          {activeTab === 'memories' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-bold text-gray-900">Campus Memory Archive</h1>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">{isEditingMemory ? 'Edit Memory' : 'Add New Campus Memory'}</h3>
                      <form onSubmit={handleMemorySubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <Input label="Title" placeholder="Event Name" required value={memoryForm.title} onChange={e => setMemoryForm({...memoryForm, title: e.target.value})} />
                              </div>
                              <Input label="Year" type="number" required value={memoryForm.year} onChange={e => setMemoryForm({...memoryForm, year: parseInt(e.target.value)})} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input label="Event Date" type="date" required value={memoryForm.date} onChange={e => setMemoryForm({...memoryForm, date: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea rows={3} className="block w-full rounded-md border-gray-600 shadow-sm border p-2 text-sm bg-gray-800 text-white" value={memoryForm.description} onChange={e => setMemoryForm({...memoryForm, description: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images (Max 15, Max 15MB each)</label>
                              <div className="flex flex-wrap gap-3 mb-4">
                                  {memoryForm.images.map((img, idx) => (
                                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                          <img src={img} alt="" className="w-full h-full object-cover" />
                                          <button type="button" onClick={() => setMemoryForm({...memoryForm, images: memoryForm.images.filter((_, i) => i !== idx)})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">
                                              <X size={12} />
                                          </button>
                                      </div>
                                  ))}
                                  {memoryForm.images.length < 15 && (
                                      <div className="relative w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-gray-200 cursor-pointer">
                                          <Plus className="text-gray-400" />
                                          <input type="file" multiple accept="image/*" onChange={handleMemoryFiles} className="absolute inset-0 opacity-0 cursor-pointer" />
                                      </div>
                                  )}
                              </div>
                          </div>
                          <div className="flex space-x-2">
                             <Button type="submit">{isEditingMemory ? 'Update Memory' : 'Create Memory'}</Button>
                             {isEditingMemory && <Button variant="secondary" onClick={() => { setIsEditingMemory(false); setMemoryForm({ title: '', year: 2024, description: '', date: '', images: [] }) }}>Cancel</Button>}
                          </div>
                      </form>
                  </div>

                  <div className="bg-white shadow rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Memory / Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photos</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {memories.map(m => (
                                  <tr key={m.id}>
                                      <td className="px-6 py-4">
                                          <div className="text-sm font-bold text-gray-900">{m.title}</div>
                                          <div className="text-xs text-gray-500">{m.date}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.year}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.images.length} images</td>
                                      <td className="px-6 py-4 text-right space-x-3">
                                          <button onClick={() => handleEditMemory(m)} className="text-blue-600 hover:text-blue-900"><Shield size={16}/></button>
                                          <button onClick={() => handleDeleteMemory(m.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                      </td>
                                  </tr>
                              ))}
                              {memories.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No memories recorded yet.</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div onClick={() => setActiveTab('students')} className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                   <div className="flex-shrink-0 bg-blue-500 rounded-md p-3"><Users className="h-6 w-6 text-white" /></div>
                   <div className="ml-5"><div className="text-sm font-medium text-gray-500">Total Students</div><div className="text-lg font-medium text-gray-900">{stats.totalStudents}</div></div>
                </div>
                <div onClick={() => setActiveTab('memories')} className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                   <div className="flex-shrink-0 bg-purple-500 rounded-md p-3"><History className="h-6 w-6 text-white" /></div>
                   <div className="ml-5"><div className="text-sm font-medium text-gray-500">Campus Memories</div><div className="text-lg font-medium text-gray-900">{memories.length}</div></div>
                </div>
                <div onClick={() => setActiveTab('submissions')} className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                   <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3"><Bell className="h-6 w-6 text-white" /></div>
                   <div className="ml-5"><div className="text-sm font-medium text-gray-500">Pending Approvals</div><div className="text-lg font-medium text-gray-900">{stats.pending}</div></div>
                </div>
              </div>
            </div>
          )}

          {/* SITE CONTENT TAB */}
          {activeTab === 'content' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-bold text-gray-900">Site Content Management</h1>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-6">
                          <div><h3 className="text-lg font-medium">Homepage Slideshow</h3><p className="text-sm text-gray-500">Max 5 images. Max 15MB per image.</p></div>
                          <div className="relative">
                              <input type="file" multiple accept="image/*" onChange={async e => {
                                 const files = e.target.files; if (!files) return;
                                 for(let i=0; i<files.length; i++) {
                                     const file = files[i];
                                     if (file.size > 15 * 1024 * 1024) {
                                         alert(`File ${file.name} exceeds 15MB limit.`);
                                         continue;
                                     }
                                     const base64 = await readFileAsBase64(file);
                                     await api.uploadCampusImage(base64);
                                 }
                                 refreshData();
                              }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              <Button><Plus className="w-4 h-4 mr-2" /> Add Slides</Button>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {campusImages.map(img => (
                              <div key={img.id} className="relative group rounded-lg overflow-hidden h-40 bg-gray-100 border border-gray-200">
                                  <img src={img.url} alt="Slide" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button onClick={() => api.deleteCampusImage(img.id).then(() => refreshData())} className="text-white hover:text-red-400 p-2"><Trash2 className="w-6 h-6" /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'students' && (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Dept</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase min-w-[180px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                        <img className="h-10 w-10 rounded-full object-cover mr-4" src={student.avatarUrl} alt="" />
                                        <div><div className="text-sm font-medium text-gray-900">{student.fullName}</div><div className="text-xs text-gray-500">{student.intake}</div></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><Badge variant={student.status === 'active' ? 'success' : 'danger'}>{student.status}</Badge></td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => handleToggleLock(student.id)} className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${student.isLocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                            {student.isLocked ? <Lock className="w-3 h-3 mr-1.5"/> : <Unlock className="w-3 h-3 mr-1.5"/>}
                                            {student.isLocked ? "Secured" : "Unsecured"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleToggleSuspend(student.id)} className="text-orange-600 ml-4"><Ban className="w-4 h-4"/></button>
                                        <button onClick={() => api.deleteStudent(student.id).then(() => refreshData())} className="text-red-600 ml-4"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
