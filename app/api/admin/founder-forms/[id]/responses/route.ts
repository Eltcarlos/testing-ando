import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ResponseStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const querySchema = z.object({
  status: z.nativeEnum(ResponseStatus).optional(),
  search: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

// GET - List responses for a form
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId } = await params;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const validated = querySchema.parse(queryParams);
    const page = parseInt(validated.page);
    const limit = parseInt(validated.limit);
    const skip = (page - 1) * limit;

    // Check if form exists
    const form = await prisma.founderForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Build filter conditions
    const where: any = {
      formId,
    };

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.search) {
      where.founderCompanyName = {
        contains: validated.search,
        mode: "insensitive",
      };
    }

    // Fetch responses
    const [responses, total] = await Promise.all([
      prisma.founderFormResponse.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.founderFormResponse.count({ where }),
    ]);

    return NextResponse.json({
      data: responses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching responses:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
