import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendBlogReviewStatusEmail } from "@/lib/email-service";
import { getBaseUrl } from "@/lib/get-base-url";

const reviewSchema = z.object({
  reviewStatus: z.enum(["approved", "rejected", "pending_review", "published"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Only admins can change review status
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Solo los administradores pueden cambiar el estado de revisión" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reviewStatus } = reviewSchema.parse(body);

    // Check if post exists
    const existingPost = await prisma.blog_posts.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Get the user who created the post to send notification email
    let userEmail: string | null = null;
    let userName: string | null = null;
    
    if (existingPost.userId) {
      const user = await prisma.user.findUnique({
        where: { id: existingPost.userId },
        select: { email: true, fullName: true },
      });
      
      if (user) {
        userEmail = user.email;
        userName = user.fullName;
      }
    }

    // Update review status
    const updatedPost = await prisma.blog_posts.update({
      where: { id },
      data: {
        reviewStatus,
        updatedAt: new Date(),
      },
    });

    // Send email notification to the user (only if status changed)
    if (userEmail && userName && existingPost.reviewStatus !== reviewStatus) {
      try {
        const baseUrl = await getBaseUrl();
        const blogUrl = `${baseUrl}/contenido/edit/${id}`;
        
        await sendBlogReviewStatusEmail(
          userEmail,
          userName,
          existingPost.title,
          reviewStatus,
          undefined,
          blogUrl
        );
      } catch (emailError) {
        console.error('Error sending review status email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Estado de revisión actualizado exitosamente",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating review status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Estado de revisión inválido", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update review status" },
      { status: 500 }
    );
  }
}
