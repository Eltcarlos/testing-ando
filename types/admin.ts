// Admin Panel Types

// Course Management Types
export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  instructor: CourseInstructor;
  entity: CourseEntity;
  thumbnail: string;
  duration: string; // e.g., "4 semanas", "12 horas"
  language: string;
  price: CoursePrice;
  prerequisites: string[];
  tags: string[];
  modules: CourseModule[];
  status: CourseStatus;
  featured: boolean;
  isNew: boolean;
  metrics: CourseMetrics;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface CourseInstructor {
  name: string;
  bio: string;
  avatar?: string;
}

export interface CoursePrice {
  isFree: boolean;
  amount?: number;
  currency?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'assignment';
  contentUrl?: string;
  duration: string; // e.g., "15 min"
  order: number;
}

export interface CourseMetrics {
  views: number;
  enrollments: number;
  completions: number;
  completionRate: number; // percentage
  averageRating: number;
  totalRatings: number;
  averageTimeToComplete: string; // e.g., "3 días"
}

export type CourseCategory =
  | 'Finanzas'
  | 'Marketing Digital'
  | 'Operaciones'
  | 'Legal'
  | 'Capital Humano'
  | 'Ventas'
  | 'Tecnología';

export type CourseLevel = 'Básico' | 'Intermedio' | 'Avanzado';

export type CourseStatus = 'Publicado' | 'Borrador' | 'Archivado';

export type CourseEntity = 'COPARMEX' | 'Sponsor A' | 'Sponsor B' | 'Aliado';

// User Management Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  company: string;
  industry?: string;
  phone?: string;
  location?: string;
  joinedAt: Date;
  lastActive?: Date;
  status: UserStatus;
  metrics: UserMetrics;
  settings: UserSettings;
}

export type UserRole = 'member' | 'admin' | 'partner' | 'strategic_partner';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserMetrics {
  coursesEnrolled: number;
  coursesCompleted: number;
  connectionsCount: number;
  eventsAttended: number;
  messagesCount: number;
}

export interface UserSettings {
  emailNotifications: boolean;
  profileVisibility: 'public' | 'members-only' | 'private';
  allowMessages: boolean;
}

// Aliados Form Invitation Types
export type AliadosInvitationStatus = 'pending' | 'sent' | 'opened' | 'completed';

export interface AliadosFormInvitation {
  id: string;
  formId: string;
  token: string;
  userId: string;
  email: string;
  name: string;
  company: string;
  status: AliadosInvitationStatus;
  responseId?: string;
  createdAt: Date;
  sentAt?: Date;
  openedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  sentBy: string;
  emailSent: boolean;
  emailOpenedCount: number;
}

export interface UserWithAliadosInvitation extends AdminUser {
  aliadosInvitation?: AliadosFormInvitation;
}

// Analytics Types
export interface PlatformAnalytics {
  users: UserAnalytics;
  courses: CourseAnalytics;
  activity: ActivityAnalytics;
  period: AnalyticsPeriod;
}

export interface UserAnalytics {
  total: number;
  newThisMonth: number;
  activeUsers: number;
  churnRate: number; // percentage
  growthRate: number; // percentage
  byRole: Record<UserRole, number>;
  byStatus: Record<UserStatus, number>;
}

export interface CourseAnalytics {
  totalPublished: number;
  totalDrafts: number;
  totalArchived: number;
  totalViews: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  averageRating: number;
  popularCategories: Array<{ category: CourseCategory; count: number }>;
}

export interface ActivityAnalytics {
  connectionsMade: number;
  eventsAttended: number;
  messagesSent: number;
  diagnosticsCompleted: number;
  matchesCreated: number;
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label: string; // e.g., "Last 30 days", "This month"
}

// Filter Types
export interface CourseFilters {
  search: string;
  category: CourseCategory | 'all';
  level: CourseLevel | 'all';
  status: CourseStatus | 'all';
  entity: CourseEntity | 'all';
}

export interface UserFilters {
  search: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
  dateRange?: { start: Date; end: Date };
}

// Form Types
export interface CourseFormData {
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  instructor: CourseInstructor;
  entity: CourseEntity;
  thumbnail: string;
  duration: string;
  language: string;
  price: CoursePrice;
  prerequisites: string[];
  tags: string[];
  modules: CourseModule[];
  status: CourseStatus;
  featured: boolean;
  isNew: boolean;
}

export interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  company: string;
  phone?: string;
  status: UserStatus;
}

// Bulk Action Types
export interface BulkAction {
  type: 'archive' | 'delete' | 'publish' | 'feature';
  itemIds: string[];
}

// Video Upload Types
export interface UploadedVideo {
  id: string;
  fileName: string;
  url: string;
  size: number; // in bytes
  uploadedAt: Date;
  thumbnail?: string;
  duration?: string; // e.g., "5:32"
}
