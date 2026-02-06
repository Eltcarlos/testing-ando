// Re-export Prisma-generated types
export type { categories as Category, blog_posts as BlogPost } from '@prisma/client';

// ═══════════════════════════════════════════════════════════
// ICON OPTIONS FOR CATEGORIES
// ═══════════════════════════════════════════════════════════

export const AVAILABLE_ICONS = [
  'TrendingUp', 'Wallet', 'Settings', 'FileText', 'Users',
  'Target', 'Megaphone', 'Laptop', 'ShoppingCart', 'Truck',
  'Shield', 'Globe', 'Heart', 'Zap', 'Briefcase', 'Home',
  'Package', 'Clock', 'Award', 'BarChart', 'Rocket', 'DollarSign',
  'PieChart', 'Building', 'Handshake'
] as const;

export type IconName = typeof AVAILABLE_ICONS[number];

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export const CONTENT_FORMATS = ['listicle', 'how_to', 'opinion', 'case_study', 'interview', 'news', 'guide', 'comparison', 'infographic'] as const;
export const POST_STATUSES = ['draft', 'review', 'published', 'archived'] as const;
export const CONTENT_SOURCES = ['ai', 'human'] as const;
export const REVIEW_STATUSES = ['pending_review', 'approved', 'rejected', 'published'] as const;

export type ContentFormat = typeof CONTENT_FORMATS[number];
export type BlogPostStatus = typeof POST_STATUSES[number];
export type ContentSource = typeof CONTENT_SOURCES[number];
export type BlogPostReviewStatus = typeof REVIEW_STATUSES[number];

// ═══════════════════════════════════════════════════════════
// EXTENDED TYPES (with relations)
// ═══════════════════════════════════════════════════════════

import type { categories as Category, blog_posts as BlogPost } from '@prisma/client';

export type CategoryWithCount = Category & {
  _count: {
    posts: number;
  };
};

export type BlogPostWithCategory = BlogPost & {
  category: Category;
};

// ═══════════════════════════════════════════════════════════
// LEGACY TYPE ALIASES (for backwards compatibility during migration)
// ═══════════════════════════════════════════════════════════

export type ContentCategory = Category;
export type PostStatus = BlogPostStatus;

// ═══════════════════════════════════════════════════════════
// PAGINATION & FILTERING TYPES
// ═══════════════════════════════════════════════════════════

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BlogPostFilters {
  adminEmail: string;
  category?: string;
  status?: BlogPostStatus;
  search?: string;
}

export interface BlogPostListResponse {
  posts: BlogPostWithCategory[];
  pagination: PaginationMeta;
}

// ═══════════════════════════════════════════════════════════
// PROMPT CUSTOMIZATION TYPES
// ═══════════════════════════════════════════════════════════

export interface PromptCustomization {
  additionalInstructions?: string; // max 500 chars
}
