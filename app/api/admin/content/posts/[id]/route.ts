import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CONTENT_FORMATS, POST_STATUSES } from "@/types/editorial";
import { auth } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  topic: z.string().optional(),
  status: z.enum(POST_STATUSES).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use $runCommandRaw to query by string _id (since we stored IDs as strings)
    const result: any = await prisma.$runCommandRaw({
      find: 'blog_posts',
      filter: { _id: id },
      limit: 1,
    });

    if (!result.cursor?.firstBatch?.length) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    const rawPost = result.cursor.firstBatch[0];

    // Convert MongoDB document to our post format
    const post = {
      id: rawPost._id,
      title: rawPost.title,
      slug: rawPost.slug,
      content: rawPost.content,
      categoryId: rawPost.categoryId,
      topic: rawPost.topic,
      format: rawPost.format,
      status: rawPost.status,
      reviewStatus: rawPost.reviewStatus,
      source: rawPost.source,
      authorName: rawPost.authorName,
      authorPosition: rawPost.authorPosition,
      createdBy: rawPost.createdBy,
      generatedAt: rawPost.generatedAt?.$date ? new Date(rawPost.generatedAt.$date) : rawPost.generatedAt,
      publishedAt: rawPost.publishedAt?.$date ? new Date(rawPost.publishedAt.$date) : rawPost.publishedAt,
      updatedAt: rawPost.updatedAt?.$date ? new Date(rawPost.updatedAt.$date) : rawPost.updatedAt,
    };

    // Fetch category separately since we removed the relation
    const category = await prisma.categories.findFirst({
      where: { id: post.categoryId },
    });

    return NextResponse.json({
      ...post,
      category: category || {
        id: post.categoryId,
        label: 'Unknown',
        slug: 'unknown',
        icon: 'HelpCircle',
      },
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

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

    const validated = updateSchema.parse(body);

    // Check if post exists using $runCommandRaw
    const checkResult: any = await prisma.$runCommandRaw({
      find: 'blog_posts',
      filter: { _id: id },
      limit: 1,
    });

    if (!checkResult.cursor?.firstBatch?.length) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    const existingPost = checkResult.cursor.firstBatch[0];

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

    // If substantive content is being updated, reset reviewStatus to pending_review
    // Only reset if title, content, categoryId, or topic change - NOT for status or other metadata
    let updateData: any = { ...validated };
    
    const contentChanged = 
      (validated.title !== undefined && validated.title !== existingPost.title) ||
      (validated.content !== undefined && validated.content !== existingPost.content) ||
      (validated.categoryId !== undefined && validated.categoryId !== existingPost.categoryId) ||
      (validated.topic !== undefined && validated.topic !== existingPost.topic);
    
    if (contentChanged) {
      updateData.reviewStatus = 'pending_review';
    }

    if (validated.title && validated.title !== existingPost.title) {
      const baseSlug = validated.title
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñü\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      const timestamp = Date.now();
      updateData.slug = `${baseSlug}-${timestamp}`;
    }

    // Update the post using $runCommandRaw
    const updateResult: any = await prisma.$runCommandRaw({
      update: 'blog_posts',
      updates: [
        {
          q: { _id: id },
          u: { $set: updateData },
        },
      ],
    });

    if (updateResult.n === 0) {
      return NextResponse.json(
        { error: "Failed to update blog post" },
        { status: 500 }
      );
    }

    // Fetch the updated post
    const updatedResult: any = await prisma.$runCommandRaw({
      find: 'blog_posts',
      filter: { _id: id },
      limit: 1,
    });

    const rawPost = updatedResult.cursor.firstBatch[0];
    const updatedPost = {
      id: rawPost._id,
      title: rawPost.title,
      slug: rawPost.slug,
      content: rawPost.content,
      categoryId: rawPost.categoryId,
      topic: rawPost.topic,
      format: rawPost.format,
      status: rawPost.status,
      createdBy: rawPost.createdBy,
      generatedAt: rawPost.generatedAt?.$date ? new Date(rawPost.generatedAt.$date) : rawPost.generatedAt,
      publishedAt: rawPost.publishedAt?.$date ? new Date(rawPost.publishedAt.$date) : rawPost.publishedAt,
      updatedAt: rawPost.updatedAt?.$date ? new Date(rawPost.updatedAt.$date) : rawPost.updatedAt,
    };

    // Fetch category separately since we removed the relation
    const category = await prisma.categories.findFirst({
      where: { id: updatedPost.categoryId },
    });

    return NextResponse.json({
      ...updatedPost,
      category: category || {
        id: updatedPost.categoryId,
        label: 'Unknown',
        slug: 'unknown',
        icon: 'HelpCircle',
      },
    });
  } catch (error) {
    console.error("Error updating blog post:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get("hard") === "true";

    // Check if post exists using $runCommandRaw
    const checkResult: any = await prisma.$runCommandRaw({
      find: 'blog_posts',
      filter: { _id: id },
      limit: 1,
    });

    if (!checkResult.cursor?.firstBatch?.length) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    const existingPost = checkResult.cursor.firstBatch[0];

    // Check if user owns this post or is admin
    const userEmail = session.user.email;
    const userRole = (session.user as any).role;
    const isOwner = existingPost.createdBy === userEmail;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este contenido" },
        { status: 403 }
      );
    }

    if (hardDelete) {
      // Hard delete - remove from database
      await prisma.$runCommandRaw({
        delete: 'blog_posts',
        deletes: [
          {
            q: { _id: id },
            limit: 1,
          },
        ],
      });
    } else {
      // Soft delete - set status to archived
      await prisma.$runCommandRaw({
        update: 'blog_posts',
        updates: [
          {
            q: { _id: id },
            u: { $set: { status: "archived" } },
          },
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
