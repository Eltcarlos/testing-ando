export type CourseDifficulty = "Principiante" | "Intermedio" | "Avanzado";

export type CourseCategory =
  | "Finanzas"
  | "Marketing Digital"
  | "Operaciones"
  | "Recursos Humanos"
  | "Legal y Fiscal"
  | "Ventas"
  | "Liderazgo"
  | "Tecnología"
  | "Administración";

export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  company?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  videoUrl?: string;
  thumbnail?: string;
  order: number;
  isCompleted?: boolean;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  instructor: Instructor;
  thumbnail: string;
  coverImage: string;
  duration: number; // total duration in hours
  studentsEnrolled: number;
  rating: number;
  totalRatings: number;
  lessons: Lesson[];
  learningObjectives: string[];
  requirements: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFeatured?: boolean;
  isNew?: boolean;
  sponsoredBy?: string;
}

export interface CourseFilters {
  category?: CourseCategory;
  difficulty?: CourseDifficulty;
  search?: string;
  featured?: boolean;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: string[];
  lastAccessedAt: Date;
  progressPercentage: number;
}
