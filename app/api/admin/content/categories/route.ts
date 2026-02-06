import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { categorySchema } from '@/lib/validations/content';

// GET - Fetch all categories (optionally filtered by creator)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const adminEmail = searchParams.get('adminEmail') || session?.user?.email;

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 });
    }

    // Fetch categories created by this admin OR default categories
    const categories = await prisma.categories.findMany({
      where: {
        OR: [
          { createdBy: adminEmail },
          { isDefault: true },
        ],
      },
      orderBy: [
        { isDefault: 'desc' }, // Default categories first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminEmail, category: categoryData } = body;

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 });
    }

    // Validate category data
    const validatedData = categorySchema.parse({
      ...categoryData,
      createdBy: adminEmail,
    });

    // Create category
    const category = await prisma.categories.create({
      data: {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding category:', error);

    // Handle duplicate slug error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese slug' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add category' },
      { status: 500 }
    );
  }
}
