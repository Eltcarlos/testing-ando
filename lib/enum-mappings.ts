import {
  CourseCategory,
  CourseLevel,
  CourseStatus,
  LessonType,
  Currency,
} from "@prisma/client";

// ==================== CATEGORY ====================

export const categoryLabels: Record<CourseCategory, string> = {
  [CourseCategory.finance]: "Finanzas",
  [CourseCategory.digital_marketing]: "Marketing Digital",
  [CourseCategory.operations]: "Operaciones",
  [CourseCategory.legal]: "Legal",
  [CourseCategory.human_capital]: "Capital Humano",
  [CourseCategory.sales]: "Ventas",
  [CourseCategory.technology]: "Tecnología",
};

export const categoryFromLabel: Record<string, CourseCategory> = {
  Finanzas: CourseCategory.finance,
  "Marketing Digital": CourseCategory.digital_marketing,
  Operaciones: CourseCategory.operations,
  Legal: CourseCategory.legal,
  "Capital Humano": CourseCategory.human_capital,
  Ventas: CourseCategory.sales,
  Tecnología: CourseCategory.technology,
};

// ==================== LEVEL ====================

export const levelLabels: Record<CourseLevel, string> = {
  [CourseLevel.basic]: "Básico",
  [CourseLevel.intermediate]: "Intermedio",
  [CourseLevel.advanced]: "Avanzado",
};

export const levelFromLabel: Record<string, CourseLevel> = {
  Básico: CourseLevel.basic,
  Intermedio: CourseLevel.intermediate,
  Avanzado: CourseLevel.advanced,
};

// ==================== STATUS ====================

export const statusLabels: Record<CourseStatus, string> = {
  [CourseStatus.draft]: "Borrador",
  [CourseStatus.published]: "Publicado",
  [CourseStatus.archived]: "Archivado",
};

export const statusFromLabel: Record<string, CourseStatus> = {
  Borrador: CourseStatus.draft,
  Publicado: CourseStatus.published,
  Archivado: CourseStatus.archived,
};

// ==================== LESSON TYPE ====================

export const lessonTypeLabels: Record<LessonType, string> = {
  [LessonType.video]: "Video",
  [LessonType.article]: "Artículo",
  [LessonType.quiz]: "Quiz",
  [LessonType.assignment]: "Tarea",
};

export const lessonTypeFromLabel: Record<string, LessonType> = {
  Video: LessonType.video,
  Artículo: LessonType.article,
  Quiz: LessonType.quiz,
  Tarea: LessonType.assignment,
};

// ==================== CURRENCY ====================

export const currencyLabels: Record<Currency, string> = {
  [Currency.mxn]: "MXN",
  [Currency.usd]: "USD",
};

export const currencyFromLabel: Record<string, Currency> = {
  MXN: Currency.mxn,
  USD: Currency.usd,
};

// ==================== ENUM ARRAYS FOR SELECT OPTIONS ====================

export const categoryOptions = Object.entries(categoryLabels).map(
  ([value, label]) => ({
    value: value as CourseCategory,
    label,
  })
);

export const levelOptions = Object.entries(levelLabels).map(
  ([value, label]) => ({
    value: value as CourseLevel,
    label,
  })
);

export const statusOptions = Object.entries(statusLabels).map(
  ([value, label]) => ({
    value: value as CourseStatus,
    label,
  })
);

export const lessonTypeOptions = Object.entries(lessonTypeLabels).map(
  ([value, label]) => ({
    value: value as LessonType,
    label,
  })
);

export const currencyOptions = Object.entries(currencyLabels).map(
  ([value, label]) => ({
    value: value as Currency,
    label,
  })
);
