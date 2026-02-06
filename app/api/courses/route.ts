import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCourseSchema, courseFiltersSchema } from '@/lib/validations/course';
import { CourseStatus } from '@prisma/client';

// GET /api/courses - List courses with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate filters
    const filters = courseFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      level: searchParams.get('level') || undefined,
      status: searchParams.get('status') || undefined,
      entity: searchParams.get('entity') || undefined,
      featured: searchParams.get('featured') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { 'instructor.name': { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    // Execute query
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.course.count({ where }),
    ]);

    // Get counts by status for UI
    const [publishedCount, draftCount, archivedCount] = await Promise.all([
      prisma.course.count({ where: { status: CourseStatus.published } }),
      prisma.course.count({ where: { status: CourseStatus.draft } }),
      prisma.course.count({ where: { status: CourseStatus.archived } }),
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        hasMore: (filters.offset || 0) + courses.length < total,
      },
      counts: {
        total,
        published: publishedCount,
        drafts: draftCount,
        archived: archivedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Error al obtener cursos' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    // Set publishedAt if status is published
    const publishedAt =
      validatedData.status === CourseStatus.published ? new Date() : null;

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        // Ensure `duration` is always a string (Prisma Create expects string)
        duration: validatedData.duration ?? '',
        publishedAt,
        metrics: {
          views: 0,
          enrollments: 0,
          completions: 0,
          completionRate: 0,
          averageRating: 0,
          totalRatings: 0,
          averageTimeToComplete: null,
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error al crear curso' },
      { status: 500 }
    );
  }
}

