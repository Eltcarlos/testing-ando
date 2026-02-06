import { NextRequest, NextResponse } from "next/server";
import prismaOnboarding from "@/lib/prisma-onboarding";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions } = body;

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Se requiere un array de preguntas" },
        { status: 400 }
      );
    }

    // Actualizar el step_number de cada pregunta
    await Promise.all(
      questions.map((q: { id: string; step_number: number }) =>
        prismaOnboarding.initialQuestionsOnboarding.update({
          where: { question_id: q.id },
          data: { step_number: q.step_number },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Orden actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al reordenar preguntas:", error);
    return NextResponse.json(
      { error: "Error al actualizar el orden de las preguntas" },
      { status: 500 }
    );
  }
}
