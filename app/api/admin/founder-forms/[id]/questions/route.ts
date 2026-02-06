import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createQuestionSchema } from "@/lib/validations/founder-form";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Add question to form
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId } = await params;
    const body = await request.json();

    const validated = createQuestionSchema.parse(body);

    // Check if form exists
    const form = await prisma.founderForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Get section from body or default to 'General'
    const section = body.section || 'General';

    // Calculate next order number (global)
    const nextOrder = form.questions.length + 1;

    // Calculate section order (position within section)
    const questionsInSection = form.questions.filter(q => q.section === section);
    const nextSectionOrder = questionsInSection.length + 1;

    // Create new question
    const newQuestion = {
      id: crypto.randomUUID(),
      order: nextOrder,
      section: section,
      sectionOrder: nextSectionOrder,
      type: validated.type,
      label: validated.label,
      description: validated.description || '',
      required: validated.required,
      options: validated.options || [],
      validation: validated.validation ? {
        allowedFileTypes: validated.validation.allowedFileTypes || [],
        maxFileSize: validated.validation.maxFileSize || null,
        maxLength: validated.validation.maxLength || null,
        minLength: validated.validation.minLength || null,
      } : null,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add question to form
    const updatedForm = await prisma.founderForm.update({
      where: { id: formId },
      data: {
        questions: {
          push: newQuestion,
        },
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("Error adding question:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid question data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add question" },
      { status: 500 }
    );
  }
}
