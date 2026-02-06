import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

// GET - Get form by slug (for public access) OR by token (for invitation access)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;

    // Check if this is a token (UUIDs are typically longer and contain more hyphens)
    // Tokens from FounderInvitation are unique strings, likely UUIDs
    const isToken = slug.length > 30 || slug.split('-').length >= 5;

    if (isToken) {
      // Handle token-based access (invitation link)
      return await getFormByToken(slug);
    } else {
      // Handle slug-based access (public form)
      return await getFormBySlug(slug);
    }
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// Get form by invitation token
async function getFormByToken(token: string) {
  // Find invitation by token
  const invitation = await prisma.founderInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Invalid or expired invitation link" },
      { status: 404 }
    );
  }

  // Check if token is expired
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invitation link has expired" },
      { status: 410 }
    );
  }

  // Check if already completed
  if (invitation.status === "completed") {
    return NextResponse.json(
      { error: "This invitation has already been completed" },
      { status: 410 }
    );
  }

  // Get form
  const form = await prisma.founderForm.findUnique({
    where: { id: invitation.formId },
  });

  if (!form) {
    return NextResponse.json(
      { error: "Form not found" },
      { status: 404 }
    );
  }

  if (form.status !== "active") {
    return NextResponse.json(
      { error: "This form is not currently active" },
      { status: 403 }
    );
  }

  // Mark invitation as opened if this is first time
  if (invitation.status === "pending" || invitation.status === "sent") {
    await prisma.founderInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "opened",
        openedAt: new Date(),
        emailOpenedCount: invitation.emailOpenedCount + 1,
      },
    });
  } else {
    // Just increment open count
    await prisma.founderInvitation.update({
      where: { id: invitation.id },
      data: {
        emailOpenedCount: invitation.emailOpenedCount + 1,
      },
    });
  }

  // Filter out archived questions
  const activeQuestions = form.questions
    .filter((q) => !q.isArchived)
    .sort((a, b) => a.order - b.order);

  // Get or create onboarding record
  let onboarding = invitation.responseId ? await prisma.onboarding.findUnique({
    where: { id: invitation.responseId },
  }) : null;

  // If not found by ID, try finding by user email
  if (!onboarding) {
    const user = await prisma.user.findUnique({
      where: { email: invitation.email },
      include: { onboarding: true }
    });
    onboarding = user?.onboarding || null;
  }

  // Return form data with pre-filled invitation info
  return NextResponse.json({
    form: {
      id: form.id,
      name: form.name,
      description: form.description,
      slug: form.slug,
      version: form.version,
      settings: form.settings,
      questions: activeQuestions,
    },
    invitation: {
      id: invitation.id,
      email: invitation.email,
      companyName: invitation.companyName,
      contactName: invitation.contactName,
      phone: invitation.phone,
    },
    response: onboarding ? {
      id: onboarding.id,
      status: onboarding.has_finalized ? "completed" : "in_progress",
      answers: Array.isArray(onboarding.raw_answers)
        ? (onboarding.raw_answers as any[]).map((a) => ({
          questionId: a.key || a.questionId,
          value: a.answer || a.value
        }))
        : [],
      progress: {
        totalQuestions: activeQuestions.length,
        answeredQuestions: Array.isArray(onboarding.raw_answers) ? onboarding.raw_answers.length : 0,
        percentage: Array.isArray(onboarding.raw_answers) ? (onboarding.raw_answers.length / activeQuestions.length) * 100 : 0
      }
    } : null,
  });
}

// Get form by slug (public access)
async function getFormBySlug(slug: string) {
  // Find active form with this slug
  const form = await prisma.founderForm.findFirst({
    where: {
      slug,
      status: "active",
    },
  });

  if (!form) {
    return NextResponse.json(
      { error: "Form not found or not active" },
      { status: 404 }
    );
  }

  // Filter out archived questions
  const activeQuestions = form.questions
    .filter((q) => !q.isArchived)
    .sort((a, b) => a.order - b.order);

  return NextResponse.json({
    id: form.id,
    name: form.name,
    description: form.description,
    slug: form.slug,
    version: form.version,
    settings: form.settings,
    questions: activeQuestions,
  });
}
