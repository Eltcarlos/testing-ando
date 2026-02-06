import {
  FounderForm,
  FounderFormResponse,
  FormStatus,
  QuestionType,
  ResponseStatus
} from '@prisma/client';

// ==================== EXTENDED TYPES ====================

export type FounderFormWithDetails = FounderForm & {
  _count?: {
    responses?: number;
  };
  responseStats?: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    abandoned: number;
    completionRate: number;
  };
};

export type FounderFormResponseWithDetails = FounderFormResponse & {
  form?: {
    name: string;
    slug: string;
    version: number;
  };
};

// ==================== ANALYTICS TYPES ====================

export interface FormAnalytics {
  totalInvited: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  abandoned: number;
  completionRate: number;
  avgTimeToComplete: number | null;
  responsesByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ResponseListItem {
  id: string;
  founderCompanyName: string;
  status: ResponseStatus;
  progress: {
    percentage: number;
    answeredQuestions: number;
    totalQuestions: number;
  };
  metadata: {
    lastActivityAt: Date | null;
    completedAt: Date | null;
  };
  createdAt: Date;
}

// ==================== UI STATE TYPES ====================

export interface QuestionFormData {
  type: QuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
  };
}

export interface FormBuilderState {
  form: FounderForm | null;
  isDirty: boolean;
  isSaving: boolean;
  activeQuestionId: string | null;
}

// ==================== EXPORT TYPES ====================

export interface ExportOptions {
  format: 'csv' | 'excel';
  includeMetadata: boolean;
  filters?: {
    status?: ResponseStatus;
    dateFrom?: string;
    dateTo?: string;
  };
}

export interface ExportData {
  headers: string[];
  rows: string[][];
  filename: string;
}

// ==================== API RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
