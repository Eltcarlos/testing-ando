import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email-service";

const sendOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Check if we're in a local development environment
 */
function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Hardcoded OTP for local development
 */
const DEV_OTP = "123456";

/**
 * Generate a 6-digit OTP code
 * In development, returns a hardcoded OTP for easy testing
 */
function generateOTP(): string {
  if (isLocalDevelopment()) {
    console.log("[DEV] Using hardcoded OTP:", DEV_OTP);
    return DEV_OTP;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = sendOTPSchema.parse(body);

    // Verify user exists and has proper permissions before sending OTP
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No existe una cuenta con este correo electrónico",
        },
        { status: 404 }
      );
    }

    // Check if user has an allowed role for the admin panel
    if (!["admin", "partner", "strategic_partner"].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Este correo no tiene acceso al panel de administración",
        },
        { status: 403 }
      );
    }

    // Check if user is suspended
    if (user.status === "suspended") {
      return NextResponse.json(
        { success: false, error: "Tu cuenta ha sido suspendida" },
        { status: 403 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find and delete existing tokens manually (MongoDB operations don't require replica set for single deletes)
    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
      },
    });

    if (existingToken) {
      await prisma.verificationToken.delete({
        where: {
          id: existingToken.id,
        },
      });
    }

    // Create new verification token
    // Note: If this still fails, your MongoDB needs to be configured as a replica set
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires: expiresAt,
      },
    });

    // Send OTP via email using unified service (skip in development)
    if (isLocalDevelopment()) {
      console.log(`[DEV] Skipping email for ${email}. Use OTP: ${otp}`);
    } else {
      await sendEmail({
        type: "otp",
        data: {
          to: email,
          otp: otp,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isLocalDevelopment()
        ? "OTP generated (dev mode - use 123456)"
        : "OTP sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
