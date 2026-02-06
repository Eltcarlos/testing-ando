import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const querySchema = z.object({
  reviewStatus: z.enum(["pending_review", "approved", "rejected", "published"]).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Only admins can access this endpoint
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Solo los administradores pueden acceder a esta vista" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const params = {
      reviewStatus: searchParams.get("reviewStatus") || undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    };

    const validated = querySchema.parse(params);
    const page = parseInt(validated.page);
    const limit = parseInt(validated.limit);
    const skip = (page - 1) * limit;

    // Build filter conditions - NO createdBy filter for admin
    const where: any = {};

    // Filter by review status
    if (validated.reviewStatus) {
      where.reviewStatus = validated.reviewStatus;
    }

    if (validated.category) {
      where.categoryId = validated.category;
    }

    if (validated.search) {
      where.OR = [
        { title: { contains: validated.search, mode: "insensitive" } },
        { content: { contains: validated.search, mode: "insensitive" } },
        { topic: { contains: validated.search, mode: "insensitive" } },
        { createdBy: { contains: validated.search, mode: "insensitive" } },
        { authorName: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // Fetch ALL posts (admin can see everything)
    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        orderBy: [
          { reviewStatus: "asc" }, // pending_review first
          { generatedAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.blog_posts.count({ where }),
    ]);

    // Fetch categories for all posts
    const categoryIds = [...new Set(posts.map(p => p.categoryId))];
    const categories = await prisma.categories.findMany({
      where: {
        id: { in: categoryIds },
      },
    });

    // Map categories to posts
    const postsWithCategories = posts.map(post => ({
      ...post,
      category: categories.find(c => c.id === post.categoryId) || {
        id: post.categoryId,
        label: 'Sin categoría',
        slug: 'unknown',
        icon: 'HelpCircle',
      },
    }));

    return NextResponse.json({
      posts: postsWithCategories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts for review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
