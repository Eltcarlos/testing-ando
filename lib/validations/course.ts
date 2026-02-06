import { z } from 'zod';
import {
  CourseCategory,
  CourseLevel,
  CourseStatus,
  LessonType,
  Currency,
} from '@prisma/client';

// ==================== EMBEDDED TYPE SCHEMAS ====================

const instructorSchema = z.object({
  name: z.string().min(1, 'Nombre del instructor es requerido'),
  bio: z.string().min(1, 'Biografía del instructor es requerida'),
  avatar: z.string().url().optional().nullable(),
});

const priceSchema = z.object({
  isFree: z.boolean().default(true),
  amount: z.number().nonnegative().optional().nullable(),
  currency: z.nativeEnum(Currency).default(Currency.mxn),
});

const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Título de la lección es requerido'),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(LessonType),
  isExternal: z.boolean().default(false),
  videoId: z.string().optional().nullable(),
  contentUrl: z.string().url().optional().nullable(),
  duration: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
});

const moduleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Título del módulo es requerido'),
  description: z.string().min(1, 'Descripción del módulo es requerida'),
  order: z.number().int().nonnegative(),
  lessons: z.array(lessonSchema).default([]),
});

const metricsSchema = z.object({
  views: z.number().int().nonnegative().default(0),
  enrollments: z.number().int().nonnegative().default(0),
  completions: z.number().int().nonnegative().default(0),
  completionRate: z.number().nonnegative().max(100).default(0),
  averageRating: z.number().nonnegative().max(5).default(0),
  totalRatings: z.number().int().nonnegative().default(0),
  averageTimeToComplete: z.string().optional().nullable(),
});

// ==================== COURSE SCHEMAS ====================

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  category: z.nativeEnum(CourseCategory),
  level: z.nativeEnum(CourseLevel),
  instructor: instructorSchema,
  entity: z.string().min(1, 'Entidad es requerida'),
  thumbnail: z.string().url().optional().nullable(),
  duration: z.string().optional().nullable(),
  language: z.string().default('es'),
  price: priceSchema.default({ isFree: true, currency: Currency.mxn }),
  prerequisites: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  modules: z.array(moduleSchema).default([]),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.draft),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(CourseCategory).optional(),
  level: z.nativeEnum(CourseLevel).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  entity: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

// ==================== BULK OPERATION SCHEMAS ====================

export const bulkActionSchema = z.object({
  action: z.enum(['archive', 'delete', 'publish', 'draft', 'feature', 'unfeature']),
  ids: z.array(z.string()).min(1, 'Se requiere al menos un ID'),
});

// ==================== TYPE EXPORTS ====================

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseFiltersInput = z.infer<typeof courseFiltersSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;

// Re-export embedded types for convenience
export type InstructorInput = z.infer<typeof instructorSchema>;
export type PriceInput = z.infer<typeof priceSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type MetricsInput = z.infer<typeof metricsSchema>;

