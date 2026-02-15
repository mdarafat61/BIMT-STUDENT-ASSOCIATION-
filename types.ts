
export enum Department {
  MT = 'Marine Technology',
  SBT = 'Shipbuilding Technology'
}

// Intake is now a string to allow "Batch 25", "Fall 2024", etc.
export type Intake = string;

export enum UserRole {
  GUEST = 'guest',
  STUDENT = 'student', 
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin'
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface SocialLink {
  platform: 'linkedin' | 'github' | 'twitter' | 'website' | 'facebook' | 'instagram';
  url: string;
}

export interface SemesterCGPA {
  semester: number;
  gpa: string; 
}

export interface Course {
  id: string;
  title: string;
  provider: string; 
  startDate: string;
  endDate: string;
  certificateUrl?: string; 
}

export interface CampusMemory {
  id: string;
  year: number;
  title: string;
  description: string;
  images: string[];
  date: string;
  createdAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  slug: string; 
  department: Department;
  intake: Intake;
  bio: string; 
  avatarUrl: string;
  galleryImages: string[];
  achievements: Achievement[];
  courses: Course[]; 
  cgpa: SemesterCGPA[]; 
  socialLinks: SocialLink[];
  contactEmail?: string; 
  views: number;
  isFeatured: boolean;
  isLocked: boolean; 
  status: 'active' | 'graduated' | 'suspended';
  createdAt: string;
}

export interface Submission {
  id: string;
  type: 'profile_update' | 'resource' | 'biography';
  studentName: string;
  department: Department;
  content: {
    intake?: string; 
    bio?: string;
    avatarUrl?: string;
    galleryImages?: string[];
    socialLinks?: SocialLink[];
    achievements?: Achievement[];
    courses?: Course[]; 
    cgpa?: SemesterCGPA[]; 
    contactEmail?: string;
    title?: string;
    description?: string;
    downloadUrl?: string;
  }; 
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Resource {
  id: string;
  title: string;
  type: 'note' | 'thesis' | 'paper';
  department: Department;
  intake?: Intake;
  subject: string;
  authorName: string;
  downloadUrl: string; 
  uploadDate: string;
  downloads: number;
  version: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'campus' | 'exam' | 'event' | 'course';
  isPinned: boolean;
  isArchived: boolean;
  postedAt: string;
  expiresAt?: string;
  attachmentUrl?: string; 
}

export interface CampusImage {
  id: string;
  url: string;
  uploadedAt: string;
}

export interface SiteConfig {
  logoUrl: string | null;
  contact: {
    address: string;
    email: string;
    phone: string;
  };
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string; 
  fullName: string;
  title: string; 
  avatarUrl: string;
  role: UserRole;
  token?: string;
  activityScore: number; 
  linkedStudentSlug?: string; 
}

export interface AuditLogEntry {
  id: string;
  action: string; 
  actor: string; 
  target: string; 
  timestamp: string;
  details?: string;
}
