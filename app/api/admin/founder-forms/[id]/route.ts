import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateFormSchema } from "@/lib/validations/founder-form";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get single form by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const form = await prisma.founderForm.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Get response statistics
    const [totalResponses, completedResponses] = await Promise.all([
      prisma.founderFormResponse.count({
        where: { formId: id },
      }),
      prisma.founderFormResponse.count({
        where: { formId: id, status: "completed" },
      }),
    ]);

    return NextResponse.json({
      ...form,
      _count: {
        responses: totalResponses,
      },
      responseStats: {
        total: totalResponses,
        completed: completedResponses,
        completionRate: totalResponses > 0 ? completedResponses / totalResponses : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching founder form:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to fetch founder form",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update form
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  return handleUpdate(request, params);
}

// PUT - Update form
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  return handleUpdate(request, params);
}

// Shared update handler
async function handleUpdate(
  request: NextRequest,
  params: RouteParams['params']
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove id from body to avoid conflict
    const { id: _id, ...updateData } = body;

    const validated = updateFormSchema.parse({ id, ...updateData });

    // Check if form exists
    const existingForm = await prisma.founderForm.findUnique({
      where: { id },
    });

    if (!existingForm) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // If publishing (changing to active status), increment version
    const shouldIncrementVersion =
      validated.status === "active" &&
      existingForm.status === "draft";

    // Build update data
    const updatePayload: any = {};

    if (validated.name !== undefined) {
      updatePayload.name = validated.name;
    }

    if (validated.description !== undefined) {
      updatePayload.description = validated.description;
    }

    if (validated.settings !== undefined) {
      updatePayload.settings = validated.settings;
    }

    if (validated.status !== undefined) {
      updatePayload.status = validated.status;
    }

    if (shouldIncrementVersion) {
      updatePayload.version = existingForm.version + 1;
    }

    // Update form
    const form = await prisma.founderForm.update({
      where: { id },
      data: updatePayload,
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error updating founder form:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update founder form" },
      { status: 500 }
    );
  }
}

// DELETE - Archive form (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if form exists
    const existingForm = await prisma.founderForm.findUnique({
      where: { id },
    });

    if (!existingForm) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting status to archived
    const form = await prisma.founderForm.update({
      where: { id },
      data: {
        status: "archived",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Form archived successfully",
      data: form,
    });
  } catch (error) {
    console.error("Error archiving founder form:", error);
    return NextResponse.json(
      { error: "Failed to archive founder form" },
      { status: 500 }
    );
  }
}
