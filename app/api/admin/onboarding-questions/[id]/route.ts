import { NextResponse } from "next/server";
import prismaOnboarding from "@/lib/prisma-onboarding";
import { auth } from "@/lib/auth";

/**
 * PUT /api/admin/onboarding-questions/[id]
 * Actualiza una pregunta de onboarding existente
 * Solo accesible para administradores
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Solo admins pueden acceder
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Solo los administradores pueden modificar preguntas" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      question_id,
      step_number,
      title,
      subtitle,
      type,
      required,
      multiline,
      max_length,
      placeholder,
      options,
      active,
    } = body;

    // Verificar que la pregunta existe
    const existing = await prismaOnboarding.initialQuestionsOnboarding.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // Si se cambia el question_id, verificar que no exista
    if (question_id && question_id !== existing.question_id) {
      const duplicate = await prismaOnboarding.initialQuestionsOnboarding.findUnique({
        where: { question_id },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe una pregunta con ese ID" },
          { status: 400 }
        );
      }
    }

    // Si se cambia el step_number, verificar que no esté duplicado
    if (step_number && step_number !== existing.step_number) {
      const duplicateStep = await prismaOnboarding.initialQuestionsOnboarding.findFirst({
        where: { 
          step_number,
          id: { not: id }
        },
      });

      if (duplicateStep) {
        return NextResponse.json(
          { error: `Ya existe una pregunta en el paso ${step_number}. Por favor usa otro número de paso.` },
          { status: 400 }
        );
      }
    }

    const question = await prismaOnboarding.initialQuestionsOnboarding.update({
      where: { id },
      data: {
        question_id,
        step_number,
        title,
        subtitle: subtitle || null,
        type,
        required,
        multiline,
        max_length: max_length || null,
        placeholder: placeholder || null,
        options: options || null,
        active,
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error updating onboarding question:", error);
    return NextResponse.json(
      { error: "Error al actualizar la pregunta" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/onboarding-questions/[id]
 * Actualiza parcialmente una pregunta (usado para toggle de active)
 * Solo accesible para administradores
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Solo admins pueden acceder
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Solo los administradores pueden modificar preguntas" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const question = await prismaOnboarding.initialQuestionsOnboarding.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error patching onboarding question:", error);
    return NextResponse.json(
      { error: "Error al actualizar la pregunta" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/onboarding-questions/[id]
 * Elimina una pregunta de onboarding
 * Solo accesible para administradores
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Solo admins pueden acceder
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Solo los administradores pueden eliminar preguntas" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prismaOnboarding.initialQuestionsOnboarding.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting onboarding question:", error);
    return NextResponse.json(
      { error: "Error al eliminar la pregunta" },
      { status: 500 }
    );
  }
}
