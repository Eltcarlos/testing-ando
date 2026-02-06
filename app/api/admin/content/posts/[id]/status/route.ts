import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const statusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { status } = statusSchema.parse(body);

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

    // Check if user owns this post or is admin
    const userEmail = session.user.email;
    const userRole = (session.user as any).role;
    const isOwner = existingPost.createdBy === userEmail;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar este contenido" },
        { status: 403 }
      );
    }

    // Update status
    const updatedPost = await prisma.blog_posts.update({
      where: { id },
      data: {
        status,
        // Update publishedAt when publishing
        ...(status === "published" && !existingPost.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating blog post status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update blog post status" },
      { status: 500 }
    );
  }
}
