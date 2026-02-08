
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
  socialLinks: SocialLink[];
  contactEmail?: string; // Made public
  views: number;
  isFeatured: boolean;
  isLocked: boolean; // New field for Secured/Unsecured
  status: 'active' | 'graduated' | 'suspended';
  createdAt: string;
}

// Updated Submission Interface
export interface Submission {
  id: string;
  type: 'profile_update' | 'resource' | 'biography';
  studentName: string;
  department: Department;
  content: {
    // For Biographies/Profiles
    intake?: string; // Added intake to submission content
    bio?: string;
    avatarUrl?: string;
    galleryImages?: string[];
    socialLinks?: SocialLink[];
    achievements?: Achievement[];
    contactEmail?: string;
    
    // For Resources
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
  attachmentUrl?: string; // Base64 string for file
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

// Updated Admin User
export interface AdminUser {
  id: string;
  username: string;
  password?: string; // Only used for auth logic, not exposed
  fullName: string;
  title: string; // e.g., "Senior Moderator"
  avatarUrl: string;
  role: UserRole;
  token?: string;
  activityScore: number; // Calculated based on logs
  linkedStudentSlug?: string; // Link to public profile
}

export interface AuditLogEntry {
  id: string;
  action: string; 
  actor: string; 
  target: string; 
  timestamp: string;
  details?: string;
}
