
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Bell, LogOut, Check, X, Shield, Activity, Trash2, Ban, Plus, Settings, Briefcase, Pin, PinOff, Upload, Book, File, Camera, Image as ImageIcon, Globe, Phone, Mail, MapPin, Lock, Unlock } from 'lucide-react';
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
  const [resourceForm, setResourceForm] = useState<{title: string, department: Department, subject: string, type: 'note' | 'thesis' | 'paper', fileBase64: string}>({
      title: '', department: Department.MT, subject: '', type: 'note', fileBase64: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
        const token = localStorage.getItem('cc_admin_token');
        if (!token) {
          navigate('/admin-portal-secure');
          return;
        }
        
        // Wait for session restore to complete
        await api.restoreSession();
        
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
             navigate('/admin-portal-secure');
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

  // Helper: Read File
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
              downloadUrl: resourceForm.fileBase64,
              version: 1
          });
          setResourceForm({ title: '', department: Department.MT, subject: '', type: 'note', fileBase64: '' });
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

  const handleProfileSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      // Automatically strip full URL to just the slug
      if (val.includes('/directory/')) {
          val = val.split('/directory/')[1].split('/')[0]; // Handle trailing slash
      } else if (val.includes('http')) {
          // Fallback simple extraction if format differs
          const parts = val.split('/');
          val = parts[parts.length - 1] || parts[parts.length - 2];
      }
      setProfileForm({...profileForm, linkedStudentSlug: val});
  };

  // Other Handlers
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

  const handleToggleLock = async (id: string) => {
      try {
          await api.toggleStudentLock(id);
          await refreshData(); // Wait for data to refresh to show new state
      } catch (e) {
          alert("Failed to toggle security");
      }
  }

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
          try {
             await api.updateAdminProfile(currentUser.id, profileForm);
             alert('Profile updated! Changes will appear on Team page.');
             window.location.reload(); 
          } catch(e) {
              alert("Update failed.");
          }
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
          {/* ... existing code ... */}
          
          {activeTab === 'students' && (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                {/* Added overflow-x-auto here for side-scrolling on mobile */}
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
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                            <div className="text-xs text-gray-500">{student.intake}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={student.status === 'active' ? 'success' : student.status === 'suspended' ? 'danger' : 'neutral'}>
                                            {student.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleToggleLock(student.id)}
                                            className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full transition-colors ${student.isLocked ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                            title={student.isLocked ? "Profile is locked (Secured)" : "Profile is editable (Unsecured)"}
                                        >
                                            {student.isLocked ? <Lock className="w-3 h-3 mr-1"/> : <Unlock className="w-3 h-3 mr-1"/>}
                                            {student.isLocked ? "Secured" : "Unsecured"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleToggleSuspend(student.id)}
                                            className={`${student.status === 'suspended' ? 'text-green-600' : 'text-orange-600'} hover:opacity-80 inline-flex items-center ml-4`}
                                        >
                                            <Ban className="w-4 h-4 mr-1"/> {student.status === 'suspended' ? 'Activate' : 'Suspend'}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteStudent(student.id)}
                                            className="text-red-600 hover:text-red-900 inline-flex items-center ml-4"
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

          {/* ... existing code ... */}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
