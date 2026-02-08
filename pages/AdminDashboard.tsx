
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Bell, LogOut, Check, X, Shield, Activity, Trash2, Ban, Plus, Settings, Briefcase, Pin, PinOff, Upload, Book, File, Camera, Image as ImageIcon, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../services/mockDb';
import { Submission, Student, AuditLogEntry, UserRole, AdminUser, Notice, Resource, Department, CampusImage, SiteConfig } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';

type Tab = 'overview' | 'students' | 'notices' | 'resources' | 'submissions' | 'logs' | 'team' | 'profile' | 'content';

// Rank Helpers
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
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
      logoUrl: null,
      contact: { address: '', email: '', phone: '' }
  });
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState({ pending: 0, totalStudents: 0 });

  // Forms
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'moderator', fullName: '', title: '', avatarUrl: '' });
  const [profileForm, setProfileForm] = useState({ fullName: '', title: '', avatarUrl: '', linkedStudentSlug: '' });
  
  // Notice Form
  const [noticeForm, setNoticeForm] = useState<{id?: string, title: string, content: string, type: 'campus' | 'exam' | 'event' | 'course', isPinned: boolean, attachmentUrl: string}>({
      title: '', content: '', type: 'campus', isPinned: true, attachmentUrl: ''
  });
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  // Resource Form
  // Changed fileBase64 to fileObj for Supabase upload
  const [resourceForm, setResourceForm] = useState<{title: string, department: Department, subject: string, type: 'note' | 'thesis' | 'paper', fileBase64: string}>({
      title: '', department: Department.CS, subject: '', type: 'note', fileBase64: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
        const token = localStorage.getItem('cc_admin_token');
        if (!token) {
          navigate('/admin-portal-secure');
          return;
        }
        
        const user = api.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            setProfileForm({ 
                fullName: user.fullName, 
                title: user.title, 
                avatarUrl: user.avatarUrl,
                linkedStudentSlug: user.linkedStudentSlug || ''
            });
        } else {
             // In real supabase, we would verify token here
             // For now, if api.currentUser isn't set, try to login or redirect
             if (!api.getCurrentUser()) {
                navigate('/admin-portal-secure');
             }
        }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
      if(currentUser) refreshData();
  }, [currentUser, activeTab]);

  const refreshData = async () => {
    try {
        const subs = await api.getSubmissions();
        const stus = await api.getStudents();
        const logs = await api.getAuditLogs();
        const nots = await api.getNotices();
        const ress = await api.getResources();
        const imgs = await api.getCampusImages();
        const config = await api.getSiteConfig();
        
        setSubmissions(subs);
        setStudents(stus);
        setAuditLogs(logs);
        setNotices(nots);
        setResources(ress);
        setCampusImages(imgs);
        setSiteConfig(config);
        setStats({
          pending: subs.filter(s => s.status === 'pending').length,
          totalStudents: stus.length
        });
    } catch (e) {
        console.error("Failed to load data", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cc_admin_token');
    navigate('/');
  };

  // Helper: Read File (Legacy support, but we pass Base64 string to Supabase for simplicity in this migration if file obj not avail)
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // --- Handlers ---

  // Notice Handlers
  const handleNoticeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // For notices, we can store the Base64 string and let the service handle upload
          const base64 = await readFileAsBase64(file);
          setNoticeForm(prev => ({ ...prev, attachmentUrl: base64 }));
      }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isEditingNotice && noticeForm.id) {
              await api.updateNotice(noticeForm.id, noticeForm);
              setIsEditingNotice(false);
          } else {
              await api.createNotice({
                  title: noticeForm.title,
                  content: noticeForm.content,
                  type: noticeForm.type,
                  isPinned: noticeForm.isPinned,
                  isArchived: false,
                  attachmentUrl: noticeForm.attachmentUrl
              });
          }
          setNoticeForm({ title: '', content: '', type: 'campus', isPinned: true, attachmentUrl: '' });
          refreshData();
          alert('Notice posted successfully!');
      } catch (e) {
          alert('Failed to post notice');
      }
  };

  const handleEditNotice = (notice: Notice) => {
      setNoticeForm({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          type: notice.type,
          isPinned: notice.isPinned,
          attachmentUrl: notice.attachmentUrl || ''
      });
      setIsEditingNotice(true);
      window.scrollTo(0, 0);
  };

  const handleDeleteNotice = async (id: string) => {
      if(window.confirm('Delete this notice?')) {
          await api.deleteNotice(id);
          refreshData();
      }
  };

  const handleTogglePin = async (notice: Notice) => {
      await api.updateNotice(notice.id, { isPinned: !notice.isPinned });
      refreshData();
  };

  // Resource Handlers
  const handleResourceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const base64 = await readFileAsBase64(file);
          setResourceForm({ ...resourceForm, fileBase64: base64 });
      }
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resourceForm.fileBase64) {
          alert('Please upload a file');
          return;
      }
      
      try {
          await api.createResource({
              title: resourceForm.title,
              department: resourceForm.department,
              subject: resourceForm.subject,
              type: resourceForm.type,
              authorName: currentUser?.fullName || 'Admin',
              downloadUrl: resourceForm.fileBase64, // Service will detect Base64 and upload to Supabase
              version: 1
          });
          setResourceForm({ title: '', department: Department.CS, subject: '', type: 'note', fileBase64: '' });
          refreshData();
          alert('Resource posted!');
      } catch (e) {
          alert('Failed to upload resource');
      }
  };

  const handleDeleteResource = async (id: string) => {
      if(window.confirm('Delete this resource?')) {
          await api.deleteResource(id);
          refreshData();
      }
  };

  // Campus Image Handlers
  const handleCampusImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (campusImages.length + files.length > 5) {
          alert("You can only have a maximum of 5 slides.");
          return;
      }

      let uploaded = 0;
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith('image/')) continue;
          
          try {
              // We pass the File object directly to our new Supabase service
              // But currently our service signature accepts string or File in implementation details
              // To be safe with the 'compressImage' logic from before which returned string:
              const base64 = await readFileAsBase64(file);
              await api.uploadCampusImage(base64);
              uploaded++;
          } catch (err: any) {
              console.error(err);
              alert(err.message);
              break; 
          }
      }
      
      e.target.value = '';
      if (uploaded > 0) {
          refreshData();
          alert(`${uploaded} image(s) added.`);
      }
  };

  const handleDeleteCampusImage = async (id: string) => {
      if (window.confirm('Remove this image from slideshow?')) {
          await api.deleteCampusImage(id);
          refreshData();
      }
  };

  // Site Config Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const base64 = await readFileAsBase64(file);
              const newConfig = { ...siteConfig, logoUrl: base64 };
              await api.updateSiteConfig(newConfig);
              setSiteConfig(newConfig);
              alert("Logo updated!");
              window.location.reload(); 
          } catch (err: any) {
              alert(err.message || "Failed to upload logo.");
          }
      }
  };

  const handleRemoveLogo = async () => {
      if(window.confirm("Remove custom logo?")) {
        const newConfig = { ...siteConfig, logoUrl: null };
        await api.updateSiteConfig(newConfig);
        setSiteConfig(newConfig);
        window.location.reload();
      }
  };

  const handleContactUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.updateSiteConfig(siteConfig);
          alert("Contact info updated!");
          window.location.reload(); 
      } catch (err: any) {
          alert(err.message);
      }
  };

  // Profile Avatar Handler
  const handleProfileAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
           const base64 = await readFileAsBase64(file);
           setProfileForm(prev => ({ ...prev, avatarUrl: base64 }));
      }
  };

  // New User Avatar Handler
  const handleNewUserAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
           const base64 = await readFileAsBase64(file);
           setNewUser(prev => ({ ...prev, avatarUrl: base64 }));
      }
  };

  // Other Handlers (Existing)
  const handleSubmissionAction = async (id: string, status: 'approved' | 'rejected') => {
    await api.updateSubmissionStatus(id, status);
    refreshData();
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Permanently delete student?')) {
        await api.deleteStudent(id);
        refreshData();
    }
  };

  const handleToggleSuspend = async (id: string) => {
    await api.toggleStudentStatus(id);
    refreshData();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.createAdminUser({
              username: newUser.username,
              password: newUser.password,
              fullName: newUser.fullName,
              title: newUser.title,
              role: newUser.role as UserRole,
              avatarUrl: newUser.avatarUrl || 'https://via.placeholder.com/150'
          });
          setNewUser({ username: '', password: '', role: 'moderator', fullName: '', title: '', avatarUrl: '' });
          refreshData();
          alert('User created!');
      } catch (err) {
          alert('Error creating user');
      }
  };

  const handleDeleteAdmin = async (id: string) => {
      if (window.confirm('Remove this staff member?')) {
          await api.deleteAdminUser(id);
          refreshData();
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (currentUser) {
          await api.updateAdminProfile(currentUser.id, profileForm);
          alert('Profile updated');
          window.location.reload(); 
      }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white shadow-lg z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center font-bold text-xl">
            <span className={`px-2 py-1 rounded text-xs mr-3 uppercase ${currentUser.role === UserRole.SUPER_ADMIN ? 'bg-red-600' : 'bg-blue-600'}`}>
                {currentUser.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Moderator'}
            </span>
            BIMT Student Association
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center text-right mr-4">
                 <div className="mr-3 hidden sm:block">
                     <div className="text-sm font-medium">{currentUser.fullName}</div>
                     <div className="text-xs text-gray-400">{getRank(currentUser.activityScore).name} (Lv.{Math.floor(currentUser.activityScore/100)})</div>
                 </div>
                 <img src={currentUser.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full border border-gray-600 object-cover" />
             </div>
             <button onClick={handleLogout} className="text-gray-400 hover:text-white flex items-center text-sm border-l border-gray-700 pl-4">
               <LogOut className="w-4 h-4 mr-1" /> Logout
             </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm hidden md:block border-r border-gray-200">
          <nav className="mt-5 px-2 space-y-1">
            <button onClick={() => setActiveTab('overview')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <LayoutDashboard className="mr-3 h-5 w-5" /> Overview
            </button>
            <button onClick={() => setActiveTab('students')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Users className="mr-3 h-5 w-5" /> Manage Students
            </button>
            <button onClick={() => setActiveTab('notices')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'notices' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Bell className="mr-3 h-5 w-5" /> Notices
            </button>
            <button onClick={() => setActiveTab('resources')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'resources' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Book className="mr-3 h-5 w-5" /> Resources
            </button>
            <button onClick={() => setActiveTab('submissions')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'submissions' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <FileText className="mr-3 h-5 w-5" /> Submissions
              {stats.pending > 0 && <span className="ml-auto bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs font-medium">{stats.pending}</span>}
            </button>
            
            <button onClick={() => setActiveTab('content')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'content' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <ImageIcon className="mr-3 h-5 w-5" /> Site Content
            </button>

            {currentUser.role === UserRole.SUPER_ADMIN && (
                <button onClick={() => setActiveTab('team')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'team' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Briefcase className="mr-3 h-5 w-5" /> Team Management
                </button>
            )}

            <button onClick={() => setActiveTab('logs')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'logs' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Activity className="mr-3 h-5 w-5" /> Audit Logs
            </button>

            <button onClick={() => setActiveTab('profile')} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Settings className="mr-3 h-5 w-5" /> My Profile
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
                   <div className="flex-shrink-0 bg-blue-500 rounded-md p-3"><Users className="h-6 w-6 text-white" /></div>
                   <div className="ml-5"><div className="text-sm font-medium text-gray-500">Total Students</div><div className="text-lg font-medium text-gray-900">{stats.totalStudents}</div></div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
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
                  
                  {/* Slideshow Manager */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                             <h3 className="text-lg font-medium">Homepage Slideshow</h3>
                             <p className="text-sm text-gray-500">Manage the rotating images on the home page hero section (Max 5 images).</p>
                          </div>
                          <div className="relative">
                              <input type="file" multiple accept="image/*" onChange={handleCampusImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              <Button><Plus className="w-4 h-4 mr-2" /> Add Slides</Button>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {campusImages.length === 0 ? (
                              <div className="col-span-full text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                  No custom slides uploaded. Default image is active.
                              </div>
                          ) : (
                              campusImages.map(img => (
                                  <div key={img.id} className="relative group rounded-lg overflow-hidden h-40 bg-gray-100 border border-gray-200">
                                      <img src={img.url} alt="Slide" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <button onClick={() => handleDeleteCampusImage(img.id)} className="text-white hover:text-red-400 p-2">
                                              <Trash2 className="w-6 h-6" />
                                          </button>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Logo Manager */}
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <h3 className="text-lg font-medium mb-4">Website Logo</h3>
                          <div className="flex items-center space-x-6">
                              <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                                  {siteConfig.logoUrl ? (
                                      <img src={siteConfig.logoUrl} alt="Logo" className="max-w-full max-h-full" />
                                  ) : (
                                      <span className="text-gray-400 text-xs">No Logo</span>
                                  )}
                              </div>
                              <div className="flex-1 space-y-3">
                                  <div className="relative">
                                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                      <Button variant="secondary" className="w-full justify-center">
                                          <Upload className="w-4 h-4 mr-2" /> Upload New Logo
                                      </Button>
                                  </div>
                                  {siteConfig.logoUrl && (
                                      <Button variant="danger" className="w-full justify-center" onClick={handleRemoveLogo}>
                                          <Trash2 className="w-4 h-4 mr-2" /> Remove Logo
                                      </Button>
                                  )}
                                  <p className="text-xs text-gray-500">Recommended size: 100x100px or larger. PNG preferred.</p>
                              </div>
                          </div>
                      </div>

                      {/* Footer Contact Info */}
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <h3 className="text-lg font-medium mb-4">Footer Contact Info</h3>
                          <form onSubmit={handleContactUpdate} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                      <MapPin className="w-3 h-3 mr-1" /> Address
                                  </label>
                                  <input 
                                    type="text" 
                                    className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                    value={siteConfig.contact.address}
                                    onChange={e => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, address: e.target.value}})}
                                  />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                          <Mail className="w-3 h-3 mr-1" /> Email
                                      </label>
                                      <input 
                                        type="email" 
                                        className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                        value={siteConfig.contact.email}
                                        onChange={e => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, email: e.target.value}})}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                          <Phone className="w-3 h-3 mr-1" /> Phone
                                      </label>
                                      <input 
                                        type="text" 
                                        className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                        value={siteConfig.contact.phone}
                                        onChange={e => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, phone: e.target.value}})}
                                      />
                                  </div>
                              </div>
                              <Button type="submit" className="w-full">Save Contact Info</Button>
                          </form>
                      </div>
                  </div>
              </div>
          )}

          {/* Other tabs follow similar patterns, sharing state */}
          {activeTab === 'notices' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-bold text-gray-900">Notice Management</h1>
                  
                  {/* Create Notice Form */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">{isEditingNotice ? 'Edit Notice' : 'Post New Notice'}</h3>
                      <form onSubmit={handleNoticeSubmit} className="space-y-4">
                          <Input label="Title" required value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                  <select className="block w-full rounded-md border-gray-300 shadow-sm border p-2" value={noticeForm.type} onChange={e => setNoticeForm({...noticeForm, type: e.target.value as any})}>
                                      <option value="campus">Campus</option>
                                      <option value="exam">Exam</option>
                                      <option value="event">Event</option>
                                      <option value="course">Course</option>
                                  </select>
                              </div>
                              <div className="flex items-center mt-6">
                                  <input type="checkbox" id="pinned" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" checked={noticeForm.isPinned} onChange={e => setNoticeForm({...noticeForm, isPinned: e.target.checked})} />
                                  <label htmlFor="pinned" className="ml-2 block text-sm text-gray-900">Pin to Top</label>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                              <textarea rows={4} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} />
                          </div>
                          
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (PDF/Image - Optional)</label>
                              <div className="flex items-center space-x-2">
                                  <input type="file" onChange={handleNoticeFile} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                              </div>
                              {noticeForm.attachmentUrl && (
                                  <p className="mt-1 text-xs text-green-600 flex items-center"><Check className="w-3 h-3 mr-1"/> File attached</p>
                              )}
                          </div>

                          <div className="flex space-x-2 pt-2">
                              <Button type="submit">{isEditingNotice ? 'Update Notice' : 'Post Notice'}</Button>
                              {isEditingNotice && <Button type="button" variant="secondary" onClick={() => { setIsEditingNotice(false); setNoticeForm({ title: '', content: '', type: 'campus', isPinned: true, attachmentUrl: '' }) }}>Cancel</Button>}
                          </div>
                      </form>
                  </div>

                  {/* List Notices */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <ul className="divide-y divide-gray-200">
                          {notices.map(notice => (
                              <li key={notice.id} className="p-6 hover:bg-gray-50 flex items-center justify-between">
                                  <div>
                                      <div className="flex items-center mb-1">
                                          {notice.isPinned && <Pin className="w-4 h-4 text-blue-600 mr-2" />}
                                          <h3 className="text-lg font-medium text-gray-900">{notice.title}</h3>
                                          <Badge className="ml-3" variant={notice.type === 'exam' ? 'danger' : 'info'}>{notice.type}</Badge>
                                      </div>
                                      <p className="text-sm text-gray-500 line-clamp-1">{notice.content}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                         <span className="text-xs text-gray-400">{new Date(notice.postedAt).toLocaleDateString()}</span>
                                         {notice.attachmentUrl && <span className="text-xs text-blue-500 flex items-center"><File className="w-3 h-3 mr-1" /> Attachment</span>}
                                      </div>
                                  </div>
                                  <div className="flex space-x-2">
                                      <Button size="sm" variant="secondary" onClick={() => handleTogglePin(notice)}>
                                          {notice.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                      </Button>
                                      <Button size="sm" variant="secondary" onClick={() => handleEditNotice(notice)}>Edit</Button>
                                      <Button size="sm" variant="danger" onClick={() => handleDeleteNotice(notice.id)}><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
          )}

          {activeTab === 'resources' && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>

                  {/* Upload Form */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Upload New Resource</h3>
                      <form onSubmit={handleResourceSubmit} className="space-y-4">
                          <Input label="Title" required value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                  <select className="block w-full rounded-md border-gray-300 shadow-sm border p-2" value={resourceForm.department} onChange={e => setResourceForm({...resourceForm, department: e.target.value as Department})}>
                                      {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                  <select className="block w-full rounded-md border-gray-300 shadow-sm border p-2" value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value as any})}>
                                      <option value="note">Note</option>
                                      <option value="thesis">Thesis</option>
                                      <option value="paper">Paper</option>
                                  </select>
                              </div>
                          </div>
                          <Input label="Subject" required value={resourceForm.subject} onChange={e => setResourceForm({...resourceForm, subject: e.target.value})} />
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF/Image)</label>
                              <input type="file" required onChange={handleResourceFile} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                          </div>
                          <Button type="submit"><Upload className="w-4 h-4 mr-2" /> Upload Resource</Button>
                      </form>
                  </div>

                  {/* List Resources */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept/Subj</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {resources.map(res => (
                                  <tr key={res.id}>
                                      <td className="px-6 py-4">
                                          <div className="text-sm font-medium text-gray-900">{res.title}</div>
                                          <div className="text-xs text-gray-500">By {res.authorName} • {new Date(res.uploadDate).toLocaleDateString()}</div>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                          <div>{res.department}</div>
                                          <div className="text-xs">{res.subject}</div>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{res.type}</td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => handleDeleteResource(res.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'team' && currentUser.role === UserRole.SUPER_ADMIN && (
              <div className="space-y-8">
                  <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                  
                  {/* Create User Form */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Create New Staff Account</h3>
                      <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Username" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                          <Input label="Password" type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                          <Input label="Full Name" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
                          <Input label="Title (e.g. Moderator)" required value={newUser.title} onChange={e => setNewUser({...newUser, title: e.target.value})} />
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                              <select className="block w-full rounded-md border-gray-300 shadow-sm border p-2" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                  <option value="moderator">Moderator</option>
                                  <option value="super_admin">Super Admin</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar Image</label>
                              <div className="flex items-center gap-3">
                                  <input type="file" onChange={handleNewUserAvatar} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                  {newUser.avatarUrl && <img src={newUser.avatarUrl} alt="Preview" className="h-10 w-10 rounded-full object-cover border" />}
                              </div>
                          </div>
                          <div className="md:col-span-2 mt-2">
                             <Button type="submit">Create User</Button>
                          </div>
                      </form>
                  </div>

                  {/* List Users */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score / Rank</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {adminUsers.map(u => {
                                  const rank = getRank(u.activityScore);
                                  return (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                            <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full mr-3 object-cover"/>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{u.fullName}</div>
                                                <div className="text-xs text-gray-500">@{u.username} • {u.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={u.role === UserRole.SUPER_ADMIN ? 'danger' : 'info'}>{u.role}</Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{u.activityScore} pts</div>
                                            <span className={`text-xs text-white px-2 py-0.5 rounded ${rank.color}`}>{rank.name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {u.id !== currentUser.id && (
                                                <button onClick={() => handleDeleteAdmin(u.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'profile' && (
              <div className="max-w-2xl">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
                  <div className="bg-white shadow rounded-lg p-6">
                      <div className="flex items-center mb-6 pb-6 border-b border-gray-100">
                          <img src={profileForm.avatarUrl} alt="" className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover" />
                          <div className="ml-6">
                              <h2 className="text-xl font-bold">{currentUser.fullName}</h2>
                              <div className="flex items-center mt-1 space-x-2">
                                  <span className={`px-2 py-0.5 rounded text-xs text-white ${getRank(currentUser.activityScore).color}`}>
                                      {getRank(currentUser.activityScore).name}
                                  </span>
                                  <span className="text-sm text-gray-500">{currentUser.activityScore} Activity Points</span>
                              </div>
                          </div>
                      </div>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                          <Input label="Full Name" value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} />
                          <Input label="Job Title" value={profileForm.title} onChange={e => setProfileForm({...profileForm, title: e.target.value})} />
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Update Avatar</label>
                              <input type="file" onChange={handleProfileAvatar} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                          </div>
                          <Input label="Linked Student Slug (Optional)" value={profileForm.linkedStudentSlug} onChange={e => setProfileForm({...profileForm, linkedStudentSlug: e.target.value})} helperText="Enter your student profile URL slug to make your team card clickable." />
                          <Button type="submit">Save Changes</Button>
                      </form>
                  </div>
              </div>
          )}
          
          {activeTab === 'students' && (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                        <img className="h-10 w-10 rounded-full object-cover mr-4" src={student.avatarUrl} alt="" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={student.status === 'active' ? 'success' : student.status === 'suspended' ? 'danger' : 'neutral'}>
                                            {student.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleToggleSuspend(student.id)}
                                            className={`${student.status === 'suspended' ? 'text-green-600' : 'text-orange-600'} hover:opacity-80 flex items-center float-right ml-4`}
                                        >
                                            <Ban className="w-4 h-4 mr-1"/> {student.status === 'suspended' ? 'Activate' : 'Suspend'}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteStudent(student.id)}
                                            className="text-red-600 hover:text-red-900 flex items-center float-right"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1"/> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Manage Submissions</h1>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <li key={sub.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h3 className="text-lg font-medium text-blue-600">{sub.studentName}</h3>
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{sub.department}</span>
                            <Badge className="ml-2" variant={sub.status === 'pending' ? 'warning' : sub.status === 'approved' ? 'success' : 'danger'}>{sub.status.toUpperCase()}</Badge>
                          </div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 mt-2">
                             {sub.type === 'biography' ? (
                                 <p className="italic">"{sub.content.bio?.substring(0, 100)}..."</p>
                             ) : (
                                 <p>Resource: {sub.content.title}</p>
                             )}
                          </div>
                        </div>
                        {sub.status === 'pending' && (
                          <div className="ml-6 flex items-center space-x-3">
                            <Button size="sm" variant="success" className="bg-green-600 text-white" onClick={() => handleSubmissionAction(sub.id, 'approved')}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => handleSubmissionAction(sub.id, 'rejected')}><X className="w-4 h-4 mr-1" /> Reject</Button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                  {submissions.length === 0 && <li className="p-6 text-center text-gray-500">No submissions found.</li>}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'logs' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {auditLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">{log.actor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.action}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.target}</td>
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
