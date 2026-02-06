import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bulkActionSchema } from '@/lib/validations/course';
import { CourseStatus } from '@prisma/client';

// POST /api/courses/bulk - Bulk operations on courses
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ids } = bulkActionSchema.parse(body);

    let result: { count: number };

    switch (action) {
      case 'archive':
        result = await prisma.course.updateMany({
          where: { id: { in: ids } },
          data: { status: CourseStatus.archived },
        });
        break;

      case 'publish':
        result = await prisma.course.updateMany({
          where: { id: { in: ids } },
          data: {
            status: CourseStatus.published,
            publishedAt: new Date(),
          },
        });
        break;

      case 'draft':
        result = await prisma.course.updateMany({
          where: { id: { in: ids } },
          data: { status: CourseStatus.draft },
        });
        break;

      case 'feature':
        result = await prisma.course.updateMany({
          where: { id: { in: ids } },
          data: { featured: true },
        });
        break;

      case 'unfeature':
        result = await prisma.course.updateMany({
          where: { id: { in: ids } },
          data: { featured: false },
        });
        break;

      case 'delete':
        result = await prisma.course.deleteMany({
          where: { id: { in: ids } },
        });
        break;

      default:
        return NextResponse.json(
          { message: 'Acción no válida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      affected: result.count,
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error en operación masiva' },
      { status: 500 }
    );
  }
}

