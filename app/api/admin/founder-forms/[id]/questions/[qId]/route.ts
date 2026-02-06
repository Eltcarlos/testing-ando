import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateQuestionSchema } from "@/lib/validations/founder-form";

interface RouteParams {
  params: Promise<{
    id: string;
    qId: string;
  }>;
}

// PUT - Update question
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId, qId: questionId } = await params;
    const body = await request.json();

    // Remove id from body
    const { id: _id, ...updateData } = body;

    const validated = updateQuestionSchema.parse({ id: questionId, ...updateData });

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

    // Find and update question
    const questionIndex = form.questions.findIndex((q) => q.id === questionId);

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Update question data
    const updatedQuestions = [...form.questions];

    // Build update payload with proper validation handling
    const updatePayload: any = {
      ...updatedQuestions[questionIndex],
      ...validated,
      updatedAt: new Date(),
    };

    // If validation is provided, ensure all required fields are defined
    if (validated.validation !== undefined) {
      updatePayload.validation = validated.validation ? {
        allowedFileTypes: validated.validation.allowedFileTypes || [],
        maxFileSize: validated.validation.maxFileSize || null,
        maxLength: validated.validation.maxLength || null,
        minLength: validated.validation.minLength || null,
      } : null;
    }

    updatedQuestions[questionIndex] = updatePayload;

    // Update form with new questions array
    await prisma.founderForm.update({
      where: { id: formId },
      data: {
        questions: updatedQuestions,
      },
    });

    return NextResponse.json(updatedQuestions[questionIndex]);
  } catch (error) {
    console.error("Error updating question:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid question data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE - Delete/Archive question
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId, qId: questionId } = await params;

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

    // Find question
    const questionIndex = form.questions.findIndex((q) => q.id === questionId);

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if there are any responses to this form
    const hasResponses = await prisma.founderFormResponse.count({
      where: {
        formId,
        answers: {
          some: {
            questionId,
          },
        },
      },
    });

    // If there are responses, soft delete (archive), otherwise hard delete
    const updatedQuestions = [...form.questions];

    if (hasResponses > 0) {
      // Soft delete - mark as archived
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        isArchived: true,
        updatedAt: new Date(),
      };
    } else {
      // Hard delete - remove from array
      updatedQuestions.splice(questionIndex, 1);

      // Reorder remaining questions
      updatedQuestions.forEach((q, idx) => {
        q.order = idx + 1;
      });
    }

    // Update form
    await prisma.founderForm.update({
      where: { id: formId },
      data: {
        questions: updatedQuestions,
      },
    });

    return NextResponse.json({
      success: true,
      message: hasResponses > 0 ? "Question archived" : "Question deleted",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
