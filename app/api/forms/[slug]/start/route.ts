import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

const startSchema = z.object({
  token: z.string(),
  invitationId: z.string(),
});

// POST - Start filling out a form (via token)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const validated = startSchema.parse(body);

    // Get invitation
    const invitation = await prisma.founderInvitation.findUnique({
      where: { id: validated.invitationId },
    });

    if (!invitation || invitation.token !== validated.token) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    // Get form - handle slug as ID if it's an ObjectId (24 chars hex)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const form = await prisma.founderForm.findFirst({
      where: isObjectId ? { id: slug } : { slug: slug },
    });

    if (!form || form.status !== "active") {
      return NextResponse.json(
        { error: "Form not found or not active" },
        { status: 404 }
      );
    }

    // Check if onboarding record already exists for this user
    const userWithOnboarding = await prisma.user.findUnique({
      where: { email: invitation.email },
      include: { onboarding: true }
    });



    // Get or create onboarding record
    let onboarding = userWithOnboarding?.onboarding;

    if (!onboarding) {
      // Find or create user
      let user = userWithOnboarding;
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: invitation.email,
            fullName: invitation.contactName,
            companyName: invitation.companyName,
            phone: invitation.phone,
            role: 'partner',
          }
        }) as any;
      }

      onboarding = await prisma.onboarding.create({
        data: {
          user_id: user!.id,
          raw_answers: [],
          token: invitation.token,
          expires_at: invitation.expiresAt,
        },
      });
    }

    // Link "responseId" (using onboarding ID) to invitation if not already linked
    if (invitation.responseId !== onboarding.id) {
      await prisma.founderInvitation.update({
        where: { id: invitation.id },
        data: {
          responseId: onboarding.id,
        },
      });
    }

    // Map raw_answers to the format expected by the frontend
    const mappedAnswers = Array.isArray(onboarding.raw_answers)
      ? (onboarding.raw_answers as any[]).map((a) => ({
        questionId: a.key || a.questionId,
        value: a.answer || a.value
      }))
      : [];

    const activeQuestionsCount = form.questions.filter((q) => !q.isArchived).length;

    // Return the onboarding record in a format compatible with the frontend
    return NextResponse.json({
      id: onboarding.id,
      status: onboarding.has_finalized ? "completed" : "in_progress",
      answers: mappedAnswers,
      progress: {
        totalQuestions: activeQuestionsCount,
        answeredQuestions: mappedAnswers.length,
        percentage: activeQuestionsCount > 0 ? (mappedAnswers.length / activeQuestionsCount) * 100 : 0,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error starting form:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to start form" },
      { status: 500 }
    );
  }
}
