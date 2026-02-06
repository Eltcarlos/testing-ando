import type { Course } from '@prisma/client';
import type {
  CreateCourseInput,
  UpdateCourseInput,
  CourseFiltersInput,
  BulkActionInput,
} from '@/lib/validations/course';

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  counts: {
    total: number;
    published: number;
    drafts: number;
    archived: number;
  };
}

export interface BulkActionResponse {
  success: boolean;
  action: string;
  affected: number;
}

// Fetch courses with optional filters
export async function fetchCourses(
  filters: CourseFiltersInput = {}
): Promise<CoursesResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.level) params.set('level', filters.level);
  if (filters.status) params.set('status', filters.status);
  if (filters.entity) params.set('entity', filters.entity);
  if (filters.featured !== undefined) params.set('featured', String(filters.featured));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const res = await fetch(`/api/courses?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Error al obtener cursos');
  }
  return res.json();
}

// Fetch a single course by ID
export async function fetchCourse(id: string): Promise<Course> {
  const res = await fetch(`/api/courses/${id}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Curso no encontrado');
    }
    throw new Error('Error al obtener curso');
  }
  return res.json();
}

// Create a new course
export async function createCourse(data: CreateCourseInput): Promise<Course> {
  const res = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al crear curso');
  }
  return res.json();
}

// Update an existing course
export async function updateCourse(
  id: string,
  data: UpdateCourseInput
): Promise<Course> {
  const res = await fetch(`/api/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al actualizar curso');
  }
  return res.json();
}

// Delete a course
export async function deleteCourse(id: string): Promise<void> {
  const res = await fetch(`/api/courses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al eliminar curso');
  }
}

// Perform bulk action on courses
export async function bulkActionCourses(
  data: BulkActionInput
): Promise<BulkActionResponse> {
  const res = await fetch('/api/courses/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error en operación masiva');
  }
  return res.json();
}

