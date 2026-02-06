import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Add a topic to an existing category
export async function POST(req: Request) {
  try {
    const { adminEmail, categorySlug, topic } = await req.json();

    if (!adminEmail || !categorySlug || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the category
    const category = await prisma.categories.findFirst({
      where: { slug: categorySlug },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if topic already exists
    if (category.topics.includes(topic)) {
      return NextResponse.json(
        { error: 'Topic already exists' },
        { status: 409 }
      );
    }

    // Add topic to the category
    const updatedCategory = await prisma.categories.update({
      where: { id: category.id },
      data: {
        topics: {
          push: topic,
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Error adding topic:', error);
    return NextResponse.json(
      { error: 'Failed to add topic' },
      { status: 500 }
    );
  }
}
