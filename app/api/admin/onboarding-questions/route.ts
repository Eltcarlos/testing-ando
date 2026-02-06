import { NextResponse } from "next/server";
import prismaOnboarding from "@/lib/prisma-onboarding";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/onboarding-questions
 * Obtiene todas las preguntas del onboarding inicial
 * Solo accesible para administradores
 */
export async function GET() {
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
        { error: "Solo los administradores pueden acceder a esta función" },
        { status: 403 }
      );
    }

    const questions = await prismaOnboarding.initialQuestionsOnboarding.findMany({
      orderBy: {
        step_number: "asc",
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching onboarding questions:", error);
    return NextResponse.json(
      { error: "Error al obtener las preguntas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/onboarding-questions
 * Crea una nueva pregunta de onboarding
 * Solo accesible para administradores
 */
export async function POST(request: Request) {
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
        { error: "Solo los administradores pueden crear preguntas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      question_id,
      step_number,
      title,
      subtitle,
      type,
      required = true,
      multiline = false,
      max_length,
      placeholder,
      options,
      active = true,
    } = body;

    // Validación básica
    if (!question_id || !step_number || !title || !type) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el question_id sea único
    const existingById = await prismaOnboarding.initialQuestionsOnboarding.findUnique({
      where: { question_id },
    });

    if (existingById) {
      return NextResponse.json(
        { error: "Ya existe una pregunta con ese ID" },
        { status: 400 }
      );
    }

    // Verificar que el step_number no esté duplicado
    const existingByStep = await prismaOnboarding.initialQuestionsOnboarding.findFirst({
      where: { step_number },
    });

    if (existingByStep) {
      return NextResponse.json(
        { error: `Ya existe una pregunta en el paso ${step_number}. Por favor usa otro número de paso.` },
        { status: 400 }
      );
    }

    const question = await prismaOnboarding.initialQuestionsOnboarding.create({
      data: {
        question_id,
        step_number,
        title,
        subtitle: subtitle || undefined,
        type,
        required,
        multiline,
        max_length: max_length || undefined,
        placeholder: placeholder || undefined,
        options: options || undefined,
        active,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Error creating onboarding question:", error);
    return NextResponse.json(
      { error: "Error al crear la pregunta" },
      { status: 500 }
    );
  }
}
