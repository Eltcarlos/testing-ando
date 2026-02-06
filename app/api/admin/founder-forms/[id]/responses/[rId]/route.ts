import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
    rId: string;
  }>;
}

// GET - Get detailed response
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId, rId: responseId } = await params;

    // Get response
    const response = await prisma.founderFormResponse.findUnique({
      where: { id: responseId },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    // Verify it belongs to the correct form
    if (response.formId !== formId) {
      return NextResponse.json(
        { error: "Response does not belong to this form" },
        { status: 400 }
      );
    }

    // Get form details
    const form = await prisma.founderForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...response,
      form: {
        name: form.name,
        slug: form.slug,
        version: form.version,
        questions: form.questions,
      },
    });
  } catch (error) {
    console.error("Error fetching response detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch response detail" },
      { status: 500 }
    );
  }
}
