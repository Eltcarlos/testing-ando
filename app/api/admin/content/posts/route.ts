import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  adminEmail: z.string().email(),
  category: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  search: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("12"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      adminEmail: searchParams.get("adminEmail"),
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "12",
    };

    const validated = querySchema.parse(params);
    const page = parseInt(validated.page);
    const limit = parseInt(validated.limit);
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      createdBy: validated.adminEmail,
    };

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.category) {
      where.categoryId = validated.category;
    }

    if (validated.search) {
      where.OR = [
        { title: { contains: validated.search, mode: "insensitive" } },
        { content: { contains: validated.search, mode: "insensitive" } },
        { topic: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // Fetch posts (without category relation since we removed it for standalone MongoDB)
    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        orderBy: {
          generatedAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.blog_posts.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);

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
