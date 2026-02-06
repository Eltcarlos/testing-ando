import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateInvitationSchema } from "@/lib/validations/founder-form";

interface RouteParams {
  params: Promise<{
    id: string;
    invId: string;
  }>;
}

// GET - Get single invitation
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId, invId } = await params;

    const invitation = await prisma.founderInvitation.findUnique({
      where: { id: invId },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.formId !== formId) {
      return NextResponse.json(
        { error: "Invitation does not belong to this form" },
        { status: 400 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}

// PUT - Update invitation
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId, invId } = await params;
    const body = await request.json();

    const { id: _id, ...updateData } = body;
    const validated = updateInvitationSchema.parse({ id: invId, ...updateData });

    // Check if invitation exists
    const existing = await prisma.founderInvitation.findUnique({
      where: { id: invId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (existing.formId !== formId) {
      return NextResponse.json(
        { error: "Invitation does not belong to this form" },
        { status: 400 }
      );
    }

    // Update invitation
    const invitation = await prisma.founderInvitation.update({
      where: { id: invId },
      data: validated,
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error updating invitation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid invitation data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 }
    );
  }
}

// DELETE - Delete invitation
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId, invId } = await params;

    // Check if invitation exists
    const existing = await prisma.founderInvitation.findUnique({
      where: { id: invId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (existing.formId !== formId) {
      return NextResponse.json(
        { error: "Invitation does not belong to this form" },
        { status: 400 }
      );
    }

    // Check if there's a response linked
    if (existing.responseId) {
      return NextResponse.json(
        { error: "Cannot delete invitation with linked response" },
        { status: 400 }
      );
    }

    // Delete invitation
    await prisma.founderInvitation.delete({
      where: { id: invId },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    );
  }
}
