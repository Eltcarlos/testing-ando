import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { submitResponseSchema } from "@/lib/validations/founder-form";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

// POST - Submit completed form
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const validated = submitResponseSchema.parse(body);

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

    // Get active questions
    const activeQuestions = form.questions.filter((q) => !q.isArchived);

    // Validate that all required questions are answered in raw_answers
    const requiredQuestions = activeQuestions.filter((q) => q.required);
    const answeredQuestionIds = new Set(validated.answers.map((a) => a.questionId));

    const missingRequiredQuestions = requiredQuestions.filter(
      (q) => !answeredQuestionIds.has(q.id)
    );

    if (missingRequiredQuestions.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required questions",
          missingQuestions: missingRequiredQuestions.map((q) => ({
            id: q.id,
            label: q.label,
          })),
        },
        { status: 400 }
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

    // Update onboarding record as completed
    const completedOnboarding = await prisma.onboarding.update({
      where: { id: onboarding.id },
      data: {
        raw_answers: rawAnswers,
        has_finalized: true,
        updated_at: new Date(),
      },
    });

    // Mark invitation as completed if linked
    const invitation = await prisma.founderInvitation.findFirst({
      where: { responseId: onboarding.id }
    });

    if (invitation) {
      await prisma.founderInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: form.settings.submitMessage || "¡Gracias por completar el formulario!",
      onboarding: completedOnboarding,
    });
  } catch (error) {
    console.error("Error submitting form:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
