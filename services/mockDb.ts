
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
  SiteConfig,
  Course,
  Achievement,
  CampusMemory
} from '../types';

// Utility: Convert DataURI to Blob for Storage
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

// Utility: Generate a simple unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

class SupabaseService {
  private currentUser: AdminUser | null = null;
  private sessionPromise: Promise<void> | null = null;

  constructor() {
    this.sessionPromise = this.restoreSession();
  }

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
        } else if (token && token.startsWith('mock_token_')) {
            const userId = token.replace('mock_token_', '');
            try {
                let dbUser = null;
                const { data: byId } = await supabase.from('team_members').select('*').eq('id', userId).maybeSingle();
                dbUser = byId;
                
                if (!dbUser && (userId === 'admin' || userId === 'alex')) {
                     const { data: byUsername } = await supabase.from('team_members').select('*').eq('username', 'alex').maybeSingle();
                     dbUser = byUsername;
                }

                if (dbUser) {
                     this.currentUser = {
                       ...dbUser,
                       role: dbUser.role as UserRole,
                       token: token
                    };
                }
            } catch (err) {
                console.error("Session restoration error", err);
            }
        }
    } catch (e) {
        console.error("Restore session failed", e);
    }
  }

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
    } catch(e) { console.error("Audit log failed", e); }
  }

  async uploadFile(file: File | Blob | string, folder: string = 'general'): Promise<string> {
      let fileToUpload: File | Blob;
      let fileName = `${Date.now()}_${generateId()}`;

      if (typeof file === 'string') {
          if (file.startsWith('data:')) {
              fileToUpload = dataURLtoBlob(file);
              const mime = file.split(';')[0].split(':')[1];
              const ext = mime.split('/')[1] || 'bin';
              fileName += `.${ext}`;
          } else {
              return file; // Already a URL
          }
      } else {
          fileToUpload = file;
          if (file instanceof File) fileName += `_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      }

      const { error } = await supabase.storage
          .from('public')
          .upload(`${folder}/${fileName}`, fileToUpload);

      if (error) throw new Error(`Upload failed: ${error.message}`);
      
      const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(`${folder}/${fileName}`);
          
      return publicUrl;
  }

  getCurrentUser() { return this.currentUser; }

  // --- Admin User Management ---
  async getAdminUsers(): Promise<AdminUser[]> {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .order('activityScore', {ascending: false});
      
      return (data || []).map((u: any) => ({
          ...u,
          role: u.role as UserRole
      }));
  }

  async createAdminUser(user: any): Promise<void> {
    if (user.avatarUrl && user.avatarUrl.startsWith('data:')) {
      user.avatarUrl = await this.uploadFile(user.avatarUrl, 'avatars');
    }
    const { error } = await supabase.from('team_members').insert(user);
    if (error) throw error;
    await this.logAction('Created Staff Account', user.username);
  }

  async deleteAdminUser(id: string): Promise<void> {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) throw error;
    await this.logAction('Deleted Staff Account', id);
  }

  async updateAdminProfile(id: string, updates: Partial<AdminUser>): Promise<void> {
     if (updates.avatarUrl && updates.avatarUrl.startsWith('data:')) {
         updates.avatarUrl = await this.uploadFile(updates.avatarUrl, 'avatars');
     }
     const { error } = await supabase.from('team_members').update(updates).eq('id', id);
     if(error) throw error;
     if (this.currentUser && this.currentUser.id === id) {
         this.currentUser = { ...this.currentUser, ...updates };
     }
     await this.logAction('Updated Staff Profile', updates.fullName || id);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const { error } = await supabase.from('team_members').update({ password: newPassword }).eq('id', id);
    if (error) throw error;
    await this.logAction('Changed Password', id);
  }

  // --- Student Management ---
  async getStudents(filter?: { dept?: string; intake?: string; search?: string }): Promise<Student[]> {
    let query = supabase.from('students').select('*');
    if (filter) {
      if (filter.dept && filter.dept !== 'All') query = query.eq('department', filter.dept);
      if (filter.intake && filter.intake !== 'All') query = query.ilike('intake', `%${filter.intake}%`);
      if (filter.search) query = query.or(`fullName.ilike.%${filter.search}%,bio.ilike.%${filter.search}%`);
    }
    const { data } = await query;
    return (data || []).map((s: any) => ({
        ...s,
        cgpa: s.cgpa || [],
        courses: s.courses || [],
        achievements: s.achievements || [],
        galleryImages: s.galleryImages || []
    }));
  }

  async getStudentBySlug(slug: string): Promise<Student | undefined> {
    const { data } = await supabase.from('students').select('*').eq('slug', slug).maybeSingle();
    if(!data) return undefined;
    return {
        ...data,
        cgpa: data.cgpa || [],
        courses: data.courses || [],
        achievements: data.achievements || [],
        galleryImages: data.galleryImages || []
    };
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
      if (updates.avatarUrl && updates.avatarUrl.startsWith('data:')) {
          updates.avatarUrl = await this.uploadFile(updates.avatarUrl, 'avatars');
      }

      if (updates.galleryImages) {
          updates.galleryImages = await Promise.all(
              updates.galleryImages.map(img => img.startsWith('data:') ? this.uploadFile(img, 'gallery') : img)
          );
      }

      if (updates.courses) {
          updates.courses = await Promise.all(
              updates.courses.map(async (course) => {
                  let certUrl = course.certificateUrl;
                  if (certUrl && certUrl.startsWith('data:')) {
                      certUrl = await this.uploadFile(certUrl, 'certificates');
                  }
                  return { ...course, id: course.id || generateId(), certificateUrl: certUrl };
              })
          );
      }

      if (updates.achievements) {
          updates.achievements = await Promise.all(
              updates.achievements.map(async (a) => {
                  let attachUrl = a.attachmentUrl;
                  if (attachUrl && attachUrl.startsWith('data:')) {
                      attachUrl = await this.uploadFile(attachUrl, 'achievements');
                  }
                  return { ...a, id: a.id || generateId(), attachmentUrl: attachUrl };
              })
          );
      }

      const { error } = await supabase.from('students').update(updates).eq('id', id);
      if (error) throw error;
      await this.logAction('Updated Student', updates.fullName || id);
  }

  async incrementStudentViews(slug: string): Promise<void> {
    const { data } = await supabase.from('students').select('views').eq('slug', slug).maybeSingle();
    if (data) {
        await supabase.from('students').update({ views: (data.views || 0) + 1 }).eq('slug', slug);
    }
  }

  async toggleStudentLock(id: string): Promise<void> {
     const { data } = await supabase.from('students').select('isLocked').eq('id', id).maybeSingle();
     if (data) {
         await supabase.from('students').update({ isLocked: !data.isLocked }).eq('id', id);
         await this.logAction('Toggled Student Lock', id, (!data.isLocked).toString());
     }
  }

  async toggleStudentStatus(id: string): Promise<void> {
     const { data } = await supabase.from('students').select('status').eq('id', id).maybeSingle();
     if (data) {
         const newStatus = data.status === 'suspended' ? 'active' : 'suspended';
         await supabase.from('students').update({ status: newStatus }).eq('id', id);
         await this.logAction('Toggled Student Status', id, newStatus);
     }
  }

  async deleteStudent(id: string): Promise<void> {
    await supabase.from('students').delete().eq('id', id);
    await this.logAction('Deleted Student', id);
  }

  // --- Campus Memory Management ---
  async getMemories(): Promise<CampusMemory[]> {
      const { data } = await supabase.from('campus_memories').select('*').order('year', { ascending: false }).order('date', { ascending: false });
      return data || [];
  }

  async createMemory(memory: any): Promise<void> {
      let images = memory.images || [];
      const uploadedImages = await Promise.all(
          images.map((img: string) => img.startsWith('data:') ? this.uploadFile(img, 'memories') : img)
      );
      await supabase.from('campus_memories').insert({ ...memory, images: uploadedImages });
      await this.logAction('Added Memory', memory.title);
  }

  async updateMemory(id: string, updates: any): Promise<void> {
      if (updates.images) {
          updates.images = await Promise.all(
              updates.images.map((img: string) => img.startsWith('data:') ? this.uploadFile(img, 'memories') : img)
          );
      }
      await supabase.from('campus_memories').update(updates).eq('id', id);
      await this.logAction('Updated Memory', updates.title || id);
  }

  async deleteMemory(id: string): Promise<void> {
      await supabase.from('campus_memories').delete().eq('id', id);
      await this.logAction('Deleted Memory', id);
  }

  // --- Submission Management ---
  async getSubmissions(): Promise<Submission[]> {
    const { data } = await supabase.from('submissions').select('*').order('submittedAt', {ascending: false});
    return data || [];
  }

  async createSubmission(sub: any): Promise<void> {
    const content = { ...sub.content };
    
    if (content.avatarUrl?.startsWith('data:')) content.avatarUrl = await this.uploadFile(content.avatarUrl, 'avatars');
    if (content.downloadUrl?.startsWith('data:')) content.downloadUrl = await this.uploadFile(content.downloadUrl, 'resources');
    
    if (content.galleryImages) {
        content.galleryImages = await Promise.all(
            content.galleryImages.map((img: string) => img.startsWith('data:') ? this.uploadFile(img, 'gallery') : img)
        );
    }

    if (content.courses) {
        content.courses = await Promise.all(content.courses.map(async (c: any) => {
            if (c.certificateUrl?.startsWith('data:')) c.certificateUrl = await this.uploadFile(c.certificateUrl, 'certificates');
            return { ...c, id: generateId() };
        }));
    }

    if (content.achievements) {
        content.achievements = await Promise.all(content.achievements.map(async (a: any) => {
            if (a.attachmentUrl?.startsWith('data:')) a.attachmentUrl = await this.uploadFile(a.attachmentUrl, 'achievements');
            return { ...a, id: a.id || generateId() };
        }));
    }

    const { error } = await supabase.from('submissions').insert({ ...sub, content });
    if (error) throw error;
  }

  async updateSubmissionStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await supabase.from('submissions').update({ status }).eq('id', id);
    if (status === 'approved') {
        const { data: sub } = await supabase.from('submissions').select('*').eq('id', id).maybeSingle();
        if (sub && sub.type === 'biography') {
            await this.createStudentFromSubmission(sub);
        }
    }
    await this.logAction('Reviewed Submission', id, status);
  }

  private async createStudentFromSubmission(sub: Submission) {
    const studentData = {
        fullName: sub.studentName,
        slug: sub.studentName.toLowerCase().replace(/ /g, '-') + '-' + generateId(),
        department: sub.department,
        intake: sub.content.intake || 'N/A', 
        bio: sub.content.bio || '',
        avatarUrl: sub.content.avatarUrl || 'https://via.placeholder.com/150',
        galleryImages: sub.content.galleryImages || [],
        achievements: sub.content.achievements || [],
        courses: sub.content.courses || [],
        cgpa: sub.content.cgpa || [],
        socialLinks: sub.content.socialLinks || [],
        contactEmail: sub.content.contactEmail,
        isFeatured: false,
        isLocked: true, 
        status: 'active'
    };
    await supabase.from('students').insert(studentData);
  }

  // --- Generic ---
  async login(username: string, password: string): Promise<AdminUser | null> {
      const { data } = await supabase.from('team_members').select('*').eq('username', username.toLowerCase().trim()).maybeSingle();
      if (data && data.password === password) {
           this.currentUser = { ...data, role: data.role as UserRole, token: 'mock_token_' + data.id };
           await this.logAction('Admin Login', 'System');
           return this.currentUser;
      }
      return null;
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> { 
      const { data } = await supabase.from('audit_logs').select('*').order('timestamp', {ascending: false}).limit(100);
      return data || [];
  }

  async getNotices(): Promise<Notice[]> { 
    const { data } = await supabase.from('notices').select('*').order('isPinned', {ascending: false}).order('postedAt', {ascending: false});
    return data || [];
  }

  async createNotice(n: any): Promise<void> {
    if (n.attachmentUrl?.startsWith('data:')) n.attachmentUrl = await this.uploadFile(n.attachmentUrl, 'notices');
    await supabase.from('notices').insert(n);
    await this.logAction('Posted Notice', n.title);
  }

  async updateNotice(id: string, updates: Partial<Notice>): Promise<void> {
    if (updates.attachmentUrl && updates.attachmentUrl.startsWith('data:')) {
      updates.attachmentUrl = await this.uploadFile(updates.attachmentUrl, 'notices');
    }
    const { error } = await supabase.from('notices').update(updates).eq('id', id);
    if (error) throw error;
    await this.logAction('Updated Notice', updates.title || id);
  }

  async deleteNotice(id: string): Promise<void> {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) throw error;
    await this.logAction('Deleted Notice', id);
  }

  async getResources(): Promise<Resource[]> { 
      const { data } = await supabase.from('resources').select('*').order('uploadDate', {ascending: false});
      return data || [];
  }

  async createResource(r: any): Promise<void> {
    if (r.downloadUrl?.startsWith('data:')) r.downloadUrl = await this.uploadFile(r.downloadUrl, 'resources');
    await supabase.from('resources').insert(r);
    await this.logAction('Uploaded Resource', r.title);
  }

  async deleteResource(id: string): Promise<void> {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;
    await this.logAction('Deleted Resource', id);
  }

  async getCampusImages(): Promise<CampusImage[]> {
    const { data } = await supabase.from('campus_images').select('*').order('uploadedAt', {ascending: false});
    return data || [];
  }

  async uploadCampusImage(base64: string): Promise<void> {
      const url = await this.uploadFile(base64, 'slideshow');
      await supabase.from('campus_images').insert({ url });
  }

  async deleteCampusImage(id: string): Promise<void> {
    const { error } = await supabase.from('campus_images').delete().eq('id', id);
    if (error) throw error;
    await this.logAction('Deleted Campus Image', id);
  }

  async getSiteConfig(): Promise<SiteConfig> {
    const { data } = await supabase.from('site_config').select('*').eq('id', 1).maybeSingle();
    return data || { logoUrl: null, contact: { address: '', email: '', phone: '' } };
  }

  async updateSiteConfig(c: SiteConfig): Promise<void> {
      if (c.logoUrl?.startsWith('data:')) c.logoUrl = await this.uploadFile(c.logoUrl, 'assets');
      await supabase.from('site_config').upsert({ id: 1, ...c });
  }
}

export const api = new SupabaseService();
