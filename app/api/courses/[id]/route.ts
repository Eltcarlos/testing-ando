import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateCourseSchema } from '@/lib/validations/course';
import { CourseStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/courses/[id] - Get single course
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Error al obtener curso' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { message: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Handle publishedAt logic
    let publishedAt = existingCourse.publishedAt;
    if (validatedData.status === CourseStatus.published && !existingCourse.publishedAt) {
      publishedAt = new Date();
    } else if (validatedData.status && validatedData.status !== CourseStatus.published) {
      // Keep existing publishedAt when archiving/drafting (for historical reference)
    }

    // Filter out null values to convert them to undefined for Prisma
    const updateData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [key, value === null ? undefined : value])
    );

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...updateData,
        publishedAt,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error al actualizar curso' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { message: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { message: 'Error al eliminar curso' },
      { status: 500 }
    );
  }
}

