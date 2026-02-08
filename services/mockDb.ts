
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

  constructor() {
    this.restoreSession();
  }

  private async restoreSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
       // In a real app, fetch profile details from a 'profiles' table
       // For this integration, we mock the admin details based on auth presence
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
    }
  }

  // --- Helpers ---
  private async logAction(action: string, target: string, details?: string) {
    if (!this.currentUser) return;
    await supabase.from('audit_logs').insert({
        action,
        actor: this.currentUser.username,
        target,
        details,
        timestamp: new Date().toISOString()
    });
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

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(`${folder}/${fileName}`);
          
      return publicUrl;
  }

  getCurrentUser() {
      return this.currentUser;
  }

  // --- Admin User Management ---
  async getAdminUsers(): Promise<AdminUser[]> {
      // Since we don't have a full profiles table set up in the SQL provided, 
      // return the current session user as a list or a mock list.
      if (this.currentUser) return [this.currentUser];
      return [];
  }

  async createAdminUser(user: any): Promise<void> {
      // Needs Supabase Admin Auth API (service_role) to create users programmatically
      console.warn("User creation requires Supabase Admin API");
  }

  async deleteAdminUser(id: string): Promise<void> {
      console.warn("User deletion requires Supabase Admin API");
  }

  async updateAdminProfile(id: string, updates: Partial<AdminUser>): Promise<void> {
     // Would update 'profiles' table
  }

  // --- Student Management ---
  async getStudents(filter?: { dept?: string; intake?: string; search?: string }): Promise<Student[]> {
    let query = supabase.from('students').select('*');

    if (filter) {
      if (filter.dept && filter.dept !== 'All') query = query.eq('department', filter.dept);
      if (filter.intake && filter.intake !== 'All') query = query.eq('intake', filter.intake);
      if (filter.search) query = query.ilike('fullName', `%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Student[];
  }

  async getStudentBySlug(slug: string): Promise<Student | undefined> {
    const { data } = await supabase.from('students').select('*').eq('slug', slug).single();
    return data;
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

  // --- Notices Management ---
  async getNotices(): Promise<Notice[]> { 
    const { data } = await supabase.from('notices').select('*').order('isPinned', {ascending: false}).order('postedAt', {ascending: false});
    return data || [];
  }

  async createNotice(notice: Omit<Notice, 'id' | 'postedAt'>): Promise<void> {
    // If attachment is base64, upload it first
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
      // Handle logo upload if it changed (base64 check)
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
    // Upload files inside content object if they exist
    const content = { ...submission.content };
    
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

    await supabase.from('submissions').insert({ ...submission, content });
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
        intake: 'Fall 2024',
        bio: sub.content.bio || '',
        avatarUrl: sub.content.avatarUrl,
        galleryImages: sub.content.galleryImages || [],
        achievements: sub.content.achievements || [],
        socialLinks: sub.content.socialLinks || [],
        contactEmail: sub.content.contactEmail,
        isFeatured: false,
        status: 'active'
    };
    await supabase.from('students').insert(studentData);
  }

  // --- Auth ---
  async login(password: string): Promise<AdminUser | null> {
      // Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
          email: 'admin@bimt.edu', // Hardcoded email for this simple migration, password matches user input
          password: password
      });

      if (error || !data.session) {
          console.error("Auth error", error);
          return null;
      }

      this.currentUser = {
           id: data.user.id,
           username: 'admin',
           fullName: 'System Administrator',
           role: UserRole.SUPER_ADMIN,
           title: 'Head of Operations',
           avatarUrl: 'https://via.placeholder.com/150',
           activityScore: 0,
           token: data.session.access_token
      };
      
      return this.currentUser;
  }

  // --- Public Getters (Rest) ---
  async getAuditLogs(): Promise<AuditLogEntry[]> { 
      const { data } = await supabase.from('audit_logs').select('*').order('timestamp', {ascending: false});
      return data || [];
  }
}

export const api = new SupabaseService();
