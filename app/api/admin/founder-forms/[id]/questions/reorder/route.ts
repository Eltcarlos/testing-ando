import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { reorderQuestionsSchema } from "@/lib/validations/founder-form";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PATCH - Reorder questions
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId } = await params;
    const body = await request.json();

    const validated = reorderQuestionsSchema.parse(body);

    // Get form
    const form = await prisma.founderForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Validate that all question IDs exist in the form
    const existingQuestionIds = new Set(form.questions.map((q) => q.id));
    const providedQuestionIds = new Set(validated.questionIds);

    if (existingQuestionIds.size !== providedQuestionIds.size) {
      return NextResponse.json(
        { error: "Question count mismatch" },
        { status: 400 }
      );
    }

    for (const qId of validated.questionIds) {
      if (!existingQuestionIds.has(qId)) {
        return NextResponse.json(
          { error: `Question ${qId} not found in form` },
          { status: 400 }
        );
      }
    }

    // Create a map of questions by ID
    const questionMap = new Map(form.questions.map((q) => [q.id, q]));

    // Reorder questions based on provided IDs
    const reorderedQuestions = validated.questionIds.map((qId, index) => {
      const question = questionMap.get(qId)!;
      return {
        ...question,
        order: index + 1,
        updatedAt: new Date(),
      };
    });

    // Update form with reordered questions
    await prisma.founderForm.update({
      where: { id: formId },
      data: {
        questions: reorderedQuestions,
      },
    });

    return NextResponse.json({
      success: true,
      questions: reorderedQuestions.map((q) => ({
        id: q.id,
        order: q.order,
      })),
    });
  } catch (error) {
    console.error("Error reordering questions:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid reorder data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to reorder questions" },
      { status: 500 }
    );
  }
}
