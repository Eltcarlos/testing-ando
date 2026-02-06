import { z } from 'zod';

// Import enums from Prisma client, with fallback definitions
let QuestionType: any, FormStatus: any, ResponseStatus: any, InvitationStatus: any;

try {
  const prismaTypes = require('@prisma/client');
  QuestionType = prismaTypes.QuestionType;
  FormStatus = prismaTypes.FormStatus;
  ResponseStatus = prismaTypes.ResponseStatus;
  InvitationStatus = prismaTypes.InvitationStatus;
} catch (e) {
  // Fallback if Prisma client is not generated yet
  console.warn('Prisma client types not available, using fallback enums');
}

// Fallback enum definitions (in case Prisma client is not ready)
if (!QuestionType) {
  QuestionType = {
    short_text: 'short_text',
    long_text: 'long_text',
    single_select: 'single_select',
    multi_select: 'multi_select',
    scale: 'scale',
    date: 'date',
    file: 'file',
  };
}

if (!FormStatus) {
  FormStatus = {
    draft: 'draft',
    active: 'active',
    archived: 'archived',
  };
}

if (!ResponseStatus) {
  ResponseStatus = {
    not_started: 'not_started',
    in_progress: 'in_progress',
    completed: 'completed',
    abandoned: 'abandoned',
  };
}

if (!InvitationStatus) {
  InvitationStatus = {
    pending: 'pending',
    sent: 'sent',
    opened: 'opened',
    completed: 'completed',
  };
}

// ==================== QUESTION SCHEMAS ====================

export const questionOptionSchema = z.object({
  value: z.string().min(1, 'Valor de opción es requerido'),
  label: z.string().min(1, 'Etiqueta de opción es requerida'),
});

export const questionValidationSchema = z.object({
  minLength: z.number().int().positive().optional(),
  maxLength: z.number().int().positive().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().int().positive().optional(),
});

export const createQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  label: z.string().min(1, 'Etiqueta es requerida').max(500, 'Etiqueta muy larga'),
  description: z.string().max(1000, 'Descripción muy larga').optional(),
  required: z.boolean().default(false),
  options: z.array(questionOptionSchema).optional(),
  validation: questionValidationSchema.optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  id: z.string(),
});

export const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string()).min(1, 'Debe proporcionar al menos una pregunta'),
});

export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;
export type QuestionValidationInput = z.infer<typeof questionValidationSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;

// ==================== FORM SCHEMAS ====================

export const formSettingsSchema = z.object({
  allowSaveDraft: z.boolean().default(true),
  showProgressBar: z.boolean().default(true),
  submitMessage: z.string().optional(),
});

export const createFormSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(200, 'Nombre muy largo'),
  description: z.string().max(2000, 'Descripción muy larga').optional(),
  settings: formSettingsSchema.optional(),
});

export const updateFormSchema = createFormSchema.partial().extend({
  id: z.string(),
  status: z.nativeEnum(FormStatus).optional(),
});

export type FormSettingsInput = z.infer<typeof formSettingsSchema>;
export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;

// ==================== RESPONSE SCHEMAS ====================

export const answerSchema = z.object({
  questionId: z.string(),
  questionLabel: z.string(),
  type: z.string(),
  value: z.any().optional(),
  fileUrl: z.string().optional(),
  // Support file object when uploading to S3. Example: { key, size, filename }
  file: z
    .object({
      key: z.string(),
      size: z.number().int().nonnegative().optional(),
      filename: z.string().optional(),
    })
    .optional(),
});

export const saveResponseSchema = z.object({
  responseId: z.string().optional(),
  currentSection: z.string().optional(),
  founderCompanyName: z.string().min(1, 'Nombre de empresa es requerido'),
  answers: z.array(answerSchema),
  founderId: z.string().optional(),
});

export const submitResponseSchema = saveResponseSchema.extend({
  // All required questions must be answered before submission
});

export type AnswerInput = z.infer<typeof answerSchema>;
export type SaveResponseInput = z.infer<typeof saveResponseSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

// ==================== QUERY FILTERS ====================

export const formFiltersSchema = z.object({
  status: z.nativeEnum(FormStatus).optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const responseFiltersSchema = z.object({
  formId: z.string(),
  status: z.nativeEnum(ResponseStatus).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type FormFilters = z.infer<typeof formFiltersSchema>;
export type ResponseFilters = z.infer<typeof responseFiltersSchema>;

// ==================== INVITATION SCHEMAS ====================

export const createInvitationSchema = z.object({
  email: z.string().email('Email inválido'),
  companyName: z.string().min(1, 'Nombre de empresa es requerido'),
  contactName: z.string().min(1, 'Nombre de contacto es requerido'),
  phone: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateInvitationSchema = createInvitationSchema.partial().extend({
  id: z.string(),
  status: z.nativeEnum(InvitationStatus).optional(),
});

export const invitationFiltersSchema = z.object({
  formId: z.string(),
  status: z.nativeEnum(InvitationStatus).optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateInvitationInput = z.infer<typeof updateInvitationSchema>;
export type InvitationFilters = z.infer<typeof invitationFiltersSchema>;
