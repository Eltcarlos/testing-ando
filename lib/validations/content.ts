import { z } from 'zod';
import { CONTENT_FORMATS, POST_STATUSES, CONTENT_SOURCES } from '@/types/editorial';

// ==================== CATEGORY SCHEMAS ====================

export const categorySchema = z.object({
  slug: z.string().min(1, 'Slug es requerido'),
  label: z.string().min(1, 'Nombre de categoría es requerido'),
  icon: z.string().min(1, 'Icono es requerido'),
  topics: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  createdBy: z.string().email('Email inválido'),
});

export const updateCategorySchema = categorySchema.partial().extend({
  id: z.string(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ==================== BLOG POST SCHEMAS ====================

export const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Título es requerido'),
  slug: z.string().min(1, 'Slug es requerido'),
  content: z.string().min(1, 'Contenido es requerido'),
  categoryId: z.string().min(1, 'Categoría es requerida'),
  topic: z.string().min(1, 'Tema es requerido'),
  format: z.enum(CONTENT_FORMATS).optional(), // Optional for human content
  source: z.enum(CONTENT_SOURCES).default('ai'), // Track content origin
  createdBy: z.string().email('Email inválido'),
});

export const updateBlogPostSchema = createBlogPostSchema.partial().extend({
  id: z.string(),
  status: z.enum(POST_STATUSES).optional(),
});

export const publishBlogPostSchema = z.object({
  id: z.string(),
});

// Schema for human content creation (no format required)
export const createHumanContentSchema = z.object({
  title: z.string().min(1, 'Título es requerido'),
  content: z.string().min(50, 'Contenido debe tener al menos 50 caracteres'),
  categoryId: z.string().min(1, 'Categoría es requerida'),
  topic: z.string().min(1, 'Tema es requerido'),
  source: z.literal('human'),
  createdBy: z.string().email('Email inválido'),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type CreateHumanContentInput = z.infer<typeof createHumanContentSchema>;

// ==================== QUERY FILTERS ====================

export const blogPostFiltersSchema = z.object({
  categoryId: z.string().optional(),
  status: z.enum(POST_STATUSES).optional(),
  createdBy: z.string().email().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type BlogPostFilters = z.infer<typeof blogPostFiltersSchema>;

// ==================== AI GENERATION SCHEMAS ====================

export const generateContentSchema = z.object({
  category: z.object({
    slug: z.string(),
    label: z.string(),
  }).nullable().optional(),
  topic: z.string().optional(),
  customTopic: z.string().optional(),
  format: z.enum(CONTENT_FORMATS),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;

// ==================== PROMPT CUSTOMIZATION SCHEMAS ====================

export const promptCustomizationSchema = z.object({
  additionalInstructions: z.string().max(500).optional(),
});

export type PromptCustomizationInput = z.infer<typeof promptCustomizationSchema>;

// Update the generate content schema to include customization
export const generateContentWithCustomizationSchema = generateContentSchema.extend({
  customization: promptCustomizationSchema.optional(),
});

export type GenerateContentWithCustomizationInput = z.infer<typeof generateContentWithCustomizationSchema>;
