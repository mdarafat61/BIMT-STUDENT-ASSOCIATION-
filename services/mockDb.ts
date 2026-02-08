
import { supabase } from './supabaseClient';
import { 
  Student, 
  Submission, 
  Resource, 
  Notice, 
  AdminUser, 
  UserRole,
  AuditLogEntry,
  CampusImage,
  SiteConfig
} from '../types';

// Convert DataURI to Blob for uploading
const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const match = arr[0].match(/:(.*?);/);
    if (!match) throw new Error("Invalid data url");
    const mime = match[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

class SupabaseService {
  private currentUser: AdminUser | null = null;
  private sessionPromise: Promise<void> | null = null;

  constructor() {
    this.sessionPromise = this.restoreSession();
  }

  // Changed to public so pages can await it
  public async restoreSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = localStorage.getItem('cc_admin_token');

        if (session) {
           this.currentUser = {
               id: session.user.id,
               username: session.user.email?.split('@')[0] || 'admin',
               fullName: 'Admin User',
               role: UserRole.SUPER_ADMIN,
               title: 'Administrator',
               avatarUrl: 'https://via.placeholder.com/150',
               activityScore: 100,
               token: session.access_token
           };
        } else if (token === 'mock_token_admin') {
            // Mock Session Restoration
            try {
                // Try to find the 'alex' user to keep session in sync with DB
                const { data } = await supabase.from('team_members').select('*').eq('username', 'alex').single();
                
                if (data) {
                     this.currentUser = {
                       id: 'fallback-admin-id', // Keep the token ID consistent
                       username: data.username,
                       fullName: data.fullName,
                       role: data.role as UserRole,
                       title: data.title,
                       avatarUrl: data.avatarUrl,
                       activityScore: data.activityScore,
                       token: 'mock_token_admin',
                       linkedStudentSlug: data.linkedStudentSlug
                    };
                } else {
                    // Default fallback if DB fetch fails
                     this.currentUser = {
                       id: 'fallback-admin-id',
                       username: 'alex',
                       fullName: 'Ahamed Alex',
                       role: UserRole.SUPER_ADMIN,
                       title: 'Head of Operations',
                       avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
                       activityScore: 1500,
                       token: 'mock_token_admin'
                    };
                }
            } catch (err) {
                console.error("Error restoring mock session", err);
            }
        }
    } catch (e) {
        console.error("Session restore failed", e);
    }
  }

  // --- Helpers ---
  private async logAction(action: string, target: string, details?: string) {
    if (!this.currentUser) return;
    try {
        await supabase.from('audit_logs').insert({
            action,
            actor: this.currentUser.username,
            target,
            details,
            timestamp: new Date().toISOString()
        });
    } catch(e) { console.error("Log failed", e); }
  }

  // --- File Upload Helper ---
  async uploadFile(file: File | Blob | string, folder: string = 'general'): Promise<string> {
      let fileToUpload: File | Blob;
      let fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

      if (typeof file === 'string') {
          if (file.startsWith('data:')) {
              fileToUpload = dataURLtoBlob(file);
              fileName += '.jpg'; // Assume jpg for base64
          } else {
              return file; // Already a URL
          }
      } else {
          fileToUpload = file;
          if (file instanceof File) fileName += `_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      }

      const { data, error } = await supabase.storage
          .from('public')
          .upload(`${folder}/${fileName}`, fileToUpload);

      if (error) {
          console.error("Storage upload error:", error);
          throw new Error(`Upload failed: ${error.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(`${folder}/${fileName}`);
          
      return publicUrl;
  }

  getCurrentUser() {
      return this.currentUser;
  }

  // --- Admin User / Team Management ---
  async getAdminUsers(): Promise<AdminUser[]> {
      const { data } = await supabase.from('team_members').select('*').order('activityScore', {ascending: false});
      
      if (data && data.length > 0) {
          return data.map(u => ({
              id: u.id,
              username: u.username || 'user',
              fullName: u.fullName,
              title: u.title,
              role: u.role as UserRole,
              avatarUrl: u.avatarUrl,
              activityScore: u.activityScore,
              linkedStudentSlug: u.linkedStudentSlug
          }));
      }
      
      // Fallback if DB empty
      if (this.currentUser) return [this.currentUser];
      return [];
  }

  async createAdminUser(user: any): Promise<void> {
      if (user.avatarUrl && user.avatarUrl.startsWith('data:')) {
          user.avatarUrl = await this.uploadFile(user.avatarUrl, 'avatars');
      }
      
      const { error } = await supabase.from('team_members').insert({
          fullName: user.fullName,
          username: user.username,
          title: user.title,
          role: user.role,
          avatarUrl: user.avatarUrl,
          activityScore: 0
      });
      
      if (error) throw new Error(error.message);
      await this.logAction('Created Staff', user.fullName);
  }

  async deleteAdminUser(id: string): Promise<void> {
      await supabase.from('team_members').delete().eq('id', id);
      await this.logAction('Deleted Staff', id);
  }

  async updateAdminProfile(id: string, updates: Partial<AdminUser>): Promise<void> {
     if (updates.avatarUrl && updates.avatarUrl.startsWith('data:')) {
         updates.avatarUrl = await this.uploadFile(updates.avatarUrl, 'avatars');
     }

     // CRITICAL FIX: If using fallback ID (logged in as 'admin'), update the 'alex' row in DB
     if (id === 'fallback-admin-id') {
        const { error } = await supabase.from('team_members').update({
             fullName: updates.fullName,
             title: updates.title,
             avatarUrl: updates.avatarUrl,
             linkedStudentSlug: updates.linkedStudentSlug
         }).eq('username', 'alex'); // Target the actual DB row
         
         if (error) {
             console.error("Failed to update DB for admin:", error);
             // Don't throw, just update local to prevent app crash
         }

         // Update local session
         if (this.currentUser) this.currentUser = { ...this.currentUser, ...updates };
         return;
     }

     // Standard update
     const { error } = await supabase.from('team_members').update({
         fullName: updates.fullName,
         title: updates.title,
         avatarUrl: updates.avatarUrl,
         linkedStudentSlug: updates.linkedStudentSlug
     }).eq('id', id);

     if(error) throw new Error(error.message);
     
     // Update local session if needed
     if (this.currentUser && this.currentUser.id === id) {
         this.currentUser = { ...this.currentUser, ...updates };
     }
  }

  // --- Student Management ---
  async getStudents(filter?: { dept?: string; intake?: string; search?: string }): Promise<Student[]> {
    let query = supabase.from('students').select('*');

    if (filter) {
      if (filter.dept && filter.dept !== 'All') query = query.eq('department', filter.dept);
      if (filter.intake && filter.intake !== 'All') query = query.ilike('intake', `%${filter.intake}%`);
      if (filter.search) query = query.ilike('fullName', `%${filter.search}%`);
    }

    const { data, error } = await query.order('isFeatured', {ascending: false});
    if (error) {
        console.error("Fetch students error:", error);
        return [];
    }
    return data as Student[];
  }

  async getStudentBySlug(slug: string): Promise<Student | undefined> {
    const { data } = await supabase.from('students').select('*').eq('slug', slug).single();
    return data;
  }

  async incrementStudentViews(slug: string): Promise<void> {
      // First get current views
      const { data } = await supabase.from('students').select('views').eq('slug', slug).single();
      if (data) {
          await supabase.from('students').update({ views: (data.views || 0) + 1 }).eq('slug', slug);
      }
  }

  async deleteStudent(id: string): Promise<void> {
    await supabase.from('students').delete().eq('id', id);
    await this.logAction('Deleted Student', id);
  }

  async toggleStudentStatus(id: string): Promise<void> {
     const { data } = await supabase.from('students').select('status').eq('id', id).single();
     if (data) {
         const newStatus = data.status === 'suspended' ? 'active' : 'suspended';
         await supabase.from('students').update({ status: newStatus }).eq('id', id);
         await this.logAction('Toggled Status', id, newStatus);
     }
  }

  async toggleStudentLock(id: string): Promise<void> {
     const { data } = await supabase.from('students').select('isLocked').eq('id', id).single();
     if (data) {
         const newLockState = !data.isLocked; // Toggle boolean
         const { error } = await supabase.from('students').update({ isLocked: newLockState }).eq('id', id);
         
         if (error) throw new Error(error.message);
         
         await this.logAction('Toggled Profile Security', id, newLockState ? 'Locked' : 'Unlocked');
     }
  }

  // --- Notices Management ---
  async getNotices(): Promise<Notice[]> { 
    const { data } = await supabase.from('notices').select('*').order('isPinned', {ascending: false}).order('postedAt', {ascending: false});
    return data || [];
  }

  async createNotice(notice: Omit<Notice, 'id' | 'postedAt'>): Promise<void> {
    let attachmentUrl = notice.attachmentUrl;
    if (attachmentUrl && attachmentUrl.startsWith('data:')) {
        attachmentUrl = await this.uploadFile(attachmentUrl, 'notices');
    }

    await supabase.from('notices').insert({ ...notice, attachmentUrl });
    await this.logAction('Posted Notice', notice.title);
  }

  async updateNotice(id: string, updates: Partial<Notice>): Promise<void> {
    await supabase.from('notices').update(updates).eq('id', id);
  }

  async deleteNotice(id: string): Promise<void> {
    await supabase.from('notices').delete().eq('id', id);
  }

  // --- Resources Management ---
  async getResources(): Promise<Resource[]> { 
      const { data } = await supabase.from('resources').select('*').order('uploadDate', {ascending: false});
      return data || [];
  }

  async createResource(resource: any): Promise<void> {
    let downloadUrl = resource.downloadUrl;
    if (downloadUrl && downloadUrl.startsWith('data:')) {
        downloadUrl = await this.uploadFile(downloadUrl, 'resources');
    }

    await supabase.from('resources').insert({ ...resource, downloadUrl });
    await this.logAction('Uploaded Resource', resource.title);
  }

  async deleteResource(id: string): Promise<void> {
    await supabase.from('resources').delete().eq('id', id);
  }

  // --- Campus Images ---
  async getCampusImages(): Promise<CampusImage[]> {
    const { data } = await supabase.from('campus_images').select('*').order('uploadedAt', {ascending: false});
    return data || [];
  }

  async uploadCampusImage(fileOrBase64: File | string): Promise<void> {
      const { count } = await supabase.from('campus_images').select('*', { count: 'exact', head: true });
      if ((count || 0) >= 5) {
          throw new Error("Maximum of 5 slides allowed.");
      }

      const url = await this.uploadFile(fileOrBase64, 'slideshow');
      await supabase.from('campus_images').insert({ url });
      await this.logAction('Uploaded Slide', 'Homepage');
  }

  async deleteCampusImage(id: string): Promise<void> {
      await supabase.from('campus_images').delete().eq('id', id);
  }

  // --- Site Config ---
  async getSiteConfig(): Promise<SiteConfig> {
    const { data } = await supabase.from('site_config').select('*').eq('id', 1).single();
    if (!data) return { logoUrl: null, contact: { address: '', email: '', phone: '' } };
    return data;
  }

  async updateSiteConfig(config: SiteConfig): Promise<void> {
      let logoUrl = config.logoUrl;
      if (logoUrl && logoUrl.startsWith('data:')) {
          logoUrl = await this.uploadFile(logoUrl, 'assets');
      }

      const { error } = await supabase.from('site_config').upsert({ 
          id: 1, 
          logoUrl: logoUrl, 
          contact: config.contact 
      });
      if (error) throw error;
  }

  // --- Submissions ---
  async getSubmissions(): Promise<Submission[]> {
    const { data } = await supabase.from('submissions').select('*').order('submittedAt', {ascending: false});
    return data || [];
  }

  async createSubmission(submission: any): Promise<void> {
    const content = { ...submission.content };
    
    // Process File Uploads first
    if (content.avatarUrl?.startsWith('data:')) {
        content.avatarUrl = await this.uploadFile(content.avatarUrl, 'avatars');
    }
    if (content.downloadUrl?.startsWith('data:')) {
        content.downloadUrl = await this.uploadFile(content.downloadUrl, 'resources');
    }
    if (content.galleryImages) {
        const newGallery = [];
        for (const img of content.galleryImages) {
            if (img.startsWith('data:')) {
                newGallery.push(await this.uploadFile(img, 'gallery'));
            } else {
                newGallery.push(img);
            }
        }
        content.galleryImages = newGallery;
    }

    const { error } = await supabase.from('submissions').insert({ ...submission, content });
    if (error) {
        console.error("Submission insert error", error);
        throw new Error(error.message);
    }
  }

  async updateSubmissionStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await supabase.from('submissions').update({ status }).eq('id', id);
    
    if (status === 'approved') {
        const { data: sub } = await supabase.from('submissions').select('*').eq('id', id).single();
        if (sub && sub.type === 'biography') {
            await this.createStudentFromSubmission(sub);
        }
    }
  }

  private async createStudentFromSubmission(sub: Submission) {
    const studentData = {
        fullName: sub.studentName,
        slug: sub.studentName.toLowerCase().replace(/ /g, '-') + '-' + Date.now().toString().slice(-4),
        department: sub.department,
        intake: sub.content.intake || 'Batch 00', // Use submitted intake or default
        bio: sub.content.bio || '',
        avatarUrl: sub.content.avatarUrl,
        galleryImages: sub.content.galleryImages || [],
        achievements: sub.content.achievements || [],
        socialLinks: sub.content.socialLinks || [],
        contactEmail: sub.content.contactEmail,
        isFeatured: false,
        isLocked: true, // Default to Secured
        status: 'active'
    };
    await supabase.from('students').insert(studentData);
  }

  // --- Auth ---
  async login(username: string, password: string): Promise<AdminUser | null> {
      // Mapping: "admin" in form -> "alex" in DB
      // FORCE LOWERCASE
      const safeUsername = username.trim().toLowerCase();
      const dbUsername = safeUsername === 'admin' ? 'alex' : safeUsername;

      // IMMEDIATE BYPASS FOR ADMIN/ADMIN123
      if (safeUsername === 'admin' && password === 'admin123') {
           // We try to fetch the real data for Alex to allow profile updates to work
           let userData = null;
           try {
               const { data } = await supabase.from('team_members').select('*').eq('username', 'alex').single();
               userData = data;
           } catch(e) {}

           if (userData) {
               this.currentUser = {
                   id: 'fallback-admin-id',
                   username: userData.username,
                   fullName: userData.fullName,
                   role: userData.role as UserRole,
                   title: userData.title,
                   avatarUrl: userData.avatarUrl,
                   activityScore: userData.activityScore,
                   token: 'mock_token_admin',
                   linkedStudentSlug: userData.linkedStudentSlug
               };
           } else {
               // Fallback if DB is empty
               this.currentUser = {
                   id: 'fallback-admin-id',
                   username: 'alex',
                   fullName: 'Ahamed Alex',
                   role: UserRole.SUPER_ADMIN,
                   title: 'Head of Operations',
                   avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
                   activityScore: 1500,
                   token: 'mock_token_admin'
               };
           }
           return this.currentUser;
      }

      // 1. Try Supabase Auth (Real auth)
      const { data } = await supabase.auth.signInWithPassword({
          email: `${safeUsername}@bimt.edu`, 
          password: password
      });

      if (data.session) {
          this.currentUser = {
               id: data.user.id,
               username: safeUsername,
               fullName: 'System Administrator',
               role: UserRole.SUPER_ADMIN,
               title: 'Head of Operations',
               avatarUrl: 'https://via.placeholder.com/150',
               activityScore: 100,
               token: data.session.access_token
          };
          return this.currentUser;
      }

      // 2. Demo Auth for Moderators (e.g. fatima / mod123)
      if (password === 'mod123') {
          try {
              // Try fetching from DB
              const { data: userData } = await supabase.from('team_members').select('*').eq('username', dbUsername).single();
              
              if (userData) {
                  this.currentUser = {
                      id: userData.id,
                      username: userData.username,
                      fullName: userData.fullName,
                      role: userData.role as UserRole,
                      title: userData.title,
                      avatarUrl: userData.avatarUrl,
                      activityScore: userData.activityScore,
                      token: 'mock_token_admin',
                      linkedStudentSlug: userData.linkedStudentSlug
                  };
                  return this.currentUser;
              }
          } catch (e) {
              console.error("Login DB fetch failed", e);
          }
      }
      
      return null;
  }

  // --- Public Getters (Rest) ---
  async getAuditLogs(): Promise<AuditLogEntry[]> { 
      const { data } = await supabase.from('audit_logs').select('*').order('timestamp', {ascending: false});
      return data || [];
  }
}

export const api = new SupabaseService();
