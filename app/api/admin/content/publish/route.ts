import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBlogPostSchema } from '@/lib/validations/content';
import { ObjectId } from 'mongodb';

// POST - Publish generated content as a blog post
export async function POST(req: Request) {
  try {
    const { adminEmail, content, categorySlug, format, topic } = await req.json();

    if (!adminEmail || !content || !categorySlug || !format || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find category by slug (using findFirst since slug is no longer unique)
    const category = await prisma.categories.findFirst({
      where: { slug: categorySlug },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Find user by email to get userId
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });

    // Extract title from markdown (first line starting with #)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] || 'Sin título';

    // Generate unique slug
    const slug =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now();

    // Check if slug already exists (using findFirst since slug is no longer unique)
    const existingPost = await prisma.blog_posts.findFirst({
      where: { slug },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'Ya existe un post con ese slug. Intenta de nuevo.' },
        { status: 409 }
      );
    }

    // Create blog post using $runCommandRaw to avoid replica set requirement
    const newId = new ObjectId();
    const now = new Date();

    const insertResult: any = await prisma.$runCommandRaw({
      insert: 'blog_posts',
      documents: [
        {
          _id: newId,
          title,
          slug,
          content,
          categoryId: category.id,
          topic,
          format,
          source: 'ai',
          status: 'published',
          createdBy: adminEmail,
          userId: user?.id || null,
          generatedAt: { $date: now.toISOString() },
          publishedAt: { $date: now.toISOString() },
          createdAt: { $date: now.toISOString() },
          updatedAt: { $date: now.toISOString() },
          reviewStatus: 'published',
        },
      ],
    });

    if (insertResult.n === 1) {
      const post = {
        id: newId.toString(),
        title,
        slug,
        content,
        categoryId: category.id,
        topic,
        format,
        source: 'ai' as const,
        status: 'published' as const,
        createdBy: adminEmail,
        userId: user?.id || null,
        generatedAt: now,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        reviewStatus: 'published' as const,
      };

      return NextResponse.json({ success: true, post }, { status: 201 });
    } else {
      throw new Error('Failed to insert blog post');
    }
  } catch (error: any) {
    console.error('Error publishing post:', error);

    // Handle duplicate slug error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un post con ese slug' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to publish post' },
      { status: 500 }
    );
  }
}
