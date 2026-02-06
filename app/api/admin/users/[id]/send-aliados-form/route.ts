import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { sendEmail } from "@/lib/email-service";
import { getBaseUrl } from "@/lib/get-base-url";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await context.params;
        const { userEmail, userName } = await request.json();

        // 1. Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Generate a token and expiration (10 minutes)
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // 3. Find the specific form "empresas-fundadoras"
        const form = await prisma.founderForm.findFirst({
            where: { slug: "empresas-fundadoras" },
        });

        if (!form) {
            return NextResponse.json({ error: "Form 'empresas-fundadoras' not found" }, { status: 404 });
        }

        // 4. Create a FounderInvitation for this user
        // This links the token-based access to the existing form system
        const invitation = await prisma.founderInvitation.create({
            data: {
                formId: form.id,
                email: userEmail || user.email,
                companyName: user.companyName || "Empresa por confirmar",
                contactName: userName || user.fullName,
                token: token,
                expiresAt: expiresAt,
                status: "sent",
                sentAt: new Date(),
            },
        });

        // 4. Log the email and generated URL (as requested)
        const baseUrl = await getBaseUrl();
        const onboardingUrl = `${baseUrl}/onboarding/partners?token=${token}`;

        // Send Onboarding Invitation email
        await sendEmail({
            type: 'onboarding-invite',
            data: {
                to: userEmail || user.email,
                userName: userName || user.fullName,
                onboardingUrl: onboardingUrl,
                expiresInMinutes: 10
            }
        });

        return NextResponse.json({
            success: true,
            message: "Onboarding form sent successfully",
            onboarding: {
                id: invitation.id,
                token: token,
                status: 'sent',
                expiresAt: expiresAt,
            },
            invitation: {
                status: 'sent'
            }
        });
    } catch (error) {
        console.error("Error sending onboarding form:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
