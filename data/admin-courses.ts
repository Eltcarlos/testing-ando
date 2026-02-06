import { courses } from './courses';
import type { AdminCourse, CourseCategory, CourseLevel, CourseStatus, CourseEntity } from '@/types/admin';

// Map existing course categories to admin categories
function mapCategory(category: string): CourseCategory {
  const categoryMap: Record<string, CourseCategory> = {
    'Finanzas': 'Finanzas',
    'Marketing Digital': 'Marketing Digital',
    'Operaciones': 'Operaciones',
    'Recursos Humanos': 'Capital Humano',
    'Legal y Fiscal': 'Legal',
    'Ventas': 'Ventas',
    'Liderazgo': 'Capital Humano',
    'Tecnología': 'Tecnología',
    'Administración': 'Operaciones',
  };
  return categoryMap[category] || 'Operaciones';
}

// Map difficulty levels
function mapDifficulty(difficulty: string): CourseLevel {
  const difficultyMap: Record<string, CourseLevel> = {
    'Principiante': 'Básico',
    'Intermedio': 'Intermedio',
    'Avanzado': 'Avanzado',
  };
  return difficultyMap[difficulty] || 'Básico';
}

// Map sponsors to entities
function mapEntity(sponsor: string): CourseEntity {
  if (sponsor.toLowerCase().includes('coparmex')) return 'COPARMEX';
  if (sponsor.toLowerCase().includes('santander') || sponsor.toLowerCase().includes('bbva') || sponsor.toLowerCase().includes('banco')) return 'Sponsor A';
  return 'Sponsor B';
}

// Generate random status for variety
function getRandomStatus(index: number): CourseStatus {
  if (index <= 8) return 'Publicado'; // Most courses are published
  if (index === 9) return 'Borrador';
  if (index === 10) return 'Borrador';
  return 'Publicado';
}

// Convert existing courses to AdminCourse format
export const adminCourses: AdminCourse[] = courses.map((course, index) => ({
  id: course.id,
  title: course.title,
  description: course.description,
  category: mapCategory(course.category),
  level: mapDifficulty(course.difficulty),
  instructor: {
    name: course.instructor.name,
    bio: course.instructor.bio,
    avatar: course.instructor.avatar,
  },
  entity: mapEntity(course.sponsoredBy || 'COPARMEX'),
  thumbnail: course.thumbnail,
  duration: `${course.duration} horas`,
  language: 'Español',
  price: {
    isFree: true, // All courses are free for now
    amount: 0,
    currency: 'MXN',
  },
  prerequisites: course.requirements || [],
  tags: course.tags || [],
  modules: [
    {
      id: `${course.id}-module-1`,
      title: 'Introducción al Curso',
      description: 'Comienza tu aprendizaje con los conceptos fundamentales',
      order: 1,
      lessons: course.lessons.slice(0, Math.ceil(course.lessons.length / 3)).map((lesson, idx) => ({
        id: lesson.id,
        title: lesson.title,
        type: 'video' as const,
        contentUrl: `https://example.com/video/${lesson.id}`,
        duration: `${lesson.duration} min`,
        order: idx + 1,
      })),
    },
    {
      id: `${course.id}-module-2`,
      title: 'Desarrollo de Habilidades',
      description: 'Profundiza en técnicas y metodologías',
      order: 2,
      lessons: course.lessons.slice(Math.ceil(course.lessons.length / 3), Math.ceil((course.lessons.length * 2) / 3)).map((lesson, idx) => ({
        id: lesson.id,
        title: lesson.title,
        type: idx % 3 === 0 ? 'article' : 'video',
        contentUrl: `https://example.com/${idx % 3 === 0 ? 'article' : 'video'}/${lesson.id}`,
        duration: `${lesson.duration} min`,
        order: idx + 1,
      })),
    },
    {
      id: `${course.id}-module-3`,
      title: 'Aplicación Práctica',
      description: 'Aplica lo aprendido en casos reales',
      order: 3,
      lessons: course.lessons.slice(Math.ceil((course.lessons.length * 2) / 3)).map((lesson, idx) => ({
        id: lesson.id,
        title: lesson.title,
        type: idx % 2 === 0 ? 'quiz' : 'video',
        contentUrl: `https://example.com/${idx % 2 === 0 ? 'quiz' : 'video'}/${lesson.id}`,
        duration: `${lesson.duration} min`,
        order: idx + 1,
      })),
    },
  ],
  status: getRandomStatus(index),
  featured: course.isFeatured || false,
  isNew: course.isNew || false,
  metrics: {
    views: course.studentsEnrolled * Math.floor(Math.random() * 3 + 2), // Estimate views
    enrollments: course.studentsEnrolled,
    completions: Math.floor(course.studentsEnrolled * (0.5 + Math.random() * 0.3)), // 50-80% completion
    completionRate: Math.floor(50 + Math.random() * 30), // 50-80%
    averageRating: course.rating,
    totalRatings: course.totalRatings,
    averageTimeToComplete: `${Math.floor(course.duration * 0.8 + Math.random() * course.duration * 0.4)} días`,
  },
  createdAt: course.createdAt,
  updatedAt: course.updatedAt,
  publishedAt: getRandomStatus(index) === 'Publicado' ? course.createdAt : undefined,
}));

// Helper function to get admin course by ID
export function getAdminCourseById(id: string): AdminCourse | undefined {
  return adminCourses.find(course => course.id === id);
}

// Helper function to filter courses
export function filterAdminCourses(
  search: string = '',
  category: string = 'all',
  level: string = 'all',
  status: string = 'all',
  entity: string = 'all'
): AdminCourse[] {
  return adminCourses.filter(course => {
    const matchesSearch = search === '' ||
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === 'all' || course.category === category;
    const matchesLevel = level === 'all' || course.level === level;
    const matchesStatus = status === 'all' || course.status === status;
    const matchesEntity = entity === 'all' || course.entity === entity;

    return matchesSearch && matchesCategory && matchesLevel && matchesStatus && matchesEntity;
  });
}

// Helper function to get course counts by status
export function getCourseCountsByStatus() {
  const counts = {
    total: adminCourses.length,
    published: adminCourses.filter(c => c.status === 'Publicado').length,
    drafts: adminCourses.filter(c => c.status === 'Borrador').length,
    archived: adminCourses.filter(c => c.status === 'Archivado').length,
  };
  return counts;
}
