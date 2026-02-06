import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { saveResponseSchema } from "@/lib/validations/founder-form";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

// PATCH - Save progress on form
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const validated = saveResponseSchema.parse(body);

    // Get form
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const form = await prisma.founderForm.findFirst({
      where: isObjectId ? { id: slug } : { slug: slug, status: "active" },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found or not active" },
        { status: 404 }
      );
    }

    // Find Onboarding record by responseId
    const targetId = validated.responseId || validated.founderId;

    if (!targetId || !/^[0-9a-fA-F]{24}$/.test(targetId)) {
      return NextResponse.json(
        { error: "Invalid or missing Onboarding ID. Please start the form first." },
        { status: 400 }
      );
    }

    const onboarding = await prisma.onboarding.findUnique({
      where: { id: targetId },
      include: { user: true }
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: "Onboarding record not found. Please start the form first." },
        { status: 404 }
      );
    }

    // Format answers for raw_answers
    const rawAnswers = validated.answers.map((ans) => ({
      key: ans.questionId,
      question: ans.questionLabel,
      answer: ans.value || (ans.fileUrl ? { fileUrl: ans.fileUrl } : ""),
      type: ans.type,
      answeredAt: new Date().toISOString(),
    }));

    // Update onboarding record
    const updatedOnboarding = await prisma.onboarding.update({
      where: { id: onboarding.id },
      data: {
        raw_answers: rawAnswers,
        updated_at: new Date(),
      },
    });

    // Return in a format compatible with the frontend
    return NextResponse.json({
      id: updatedOnboarding.id,
      status: updatedOnboarding.has_finalized ? "completed" : "in_progress",
      answers: updatedOnboarding.raw_answers,
      progress: {
        totalQuestions: form.questions.filter(q => !q.isArchived).length,
        answeredQuestions: rawAnswers.length,
        percentage: (rawAnswers.length / form.questions.filter(q => !q.isArchived).length) * 100,
      }
    });
  } catch (error) {
    console.error("Error saving form progress:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save form progress" },
      { status: 500 }
    );
  }
}
