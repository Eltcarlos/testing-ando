import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createFormSchema, formFiltersSchema } from "@/lib/validations/founder-form";

// Helper function to generate unique slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.founderForm.findFirst({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// GET - List all forms with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
    };

    const validated = formFiltersSchema.parse(params);

    // Build filter conditions
    const where: any = {};

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { description: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // Fetch forms
    const [forms, total] = await Promise.all([
      prisma.founderForm.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        skip: validated.offset,
        take: validated.limit,
      }),
      prisma.founderForm.count({ where }),
    ]);

    // Get response counts for each form
    const formsWithCounts = await Promise.all(
      forms.map(async (form) => {
        const responseCount = await prisma.founderFormResponse.count({
          where: { formId: form.id },
        });

        return {
          ...form,
          _count: {
            responses: responseCount,
          },
        };
      })
    );

    return NextResponse.json({
      data: formsWithCounts,
      pagination: {
        limit: validated.limit,
        offset: validated.offset,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching founder forms:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch founder forms" },
      { status: 500 }
    );
  }
}

// POST - Create new form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createFormSchema.parse(body);

    // Generate unique slug from name
    const baseSlug = generateSlug(validated.name);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    // Get createdBy from request (in production, this should come from auth)
    // For now, using a default value
    const createdBy = "admin@coparmex.org"; // TODO: Replace with actual auth user

    // Create form with default settings
    const form = await prisma.founderForm.create({
      data: {
        name: validated.name,
        description: validated.description || "",
        slug: uniqueSlug,
        status: "draft",
        version: 1,
        questions: [],
        settings: {
          allowSaveDraft: validated.settings?.allowSaveDraft ?? true,
          showProgressBar: validated.settings?.showProgressBar ?? true,
          submitMessage: validated.settings?.submitMessage || "¡Gracias por completar el formulario!",
        },
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Error creating founder form:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create founder form" },
      { status: 500 }
    );
  }
}
