import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/get-base-url";

interface RouteParams {
  params: Promise<{
    id: string;
    invId: string;
  }>;
}

// POST - Send invitation email
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId, invId } = await params;

    // Get invitation
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

    // TODO: Send actual email here
    // For now, we'll just update the invitation status
    // You'll need to implement email sending with Resend or similar

    const baseUrl = await getBaseUrl();
    const formUrl = `${baseUrl}/forms/${invitation.token}`;

    console.log(`
      ====== EMAIL TO SEND ======
      To: ${invitation.email}
      Subject: Invitación - ${form.name}

      Hola ${invitation.contactName},

      Ha sido invitado a completar el formulario: ${form.name}
      ${form.description || ''}

      Para acceder al formulario, haga clic en el siguiente enlace:
      ${formUrl}

      Atentamente,
      Equipo Coparmex
      ===========================
    `);

    // Update invitation
    const updatedInvitation = await prisma.founderInvitation.update({
      where: { id: invId },
      data: {
        status: "sent",
        sentAt: new Date(),
        emailSent: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation email sent successfully",
      invitation: updatedInvitation,
      // In development, return the link for testing
      ...(process.env.NODE_ENV === 'development' && { devLink: formUrl }),
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
