import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Check role permissions (admin, partner, strategic_partner)
    const userRole = (session.user as any).role;
    if (!['admin', 'partner', 'strategic_partner'].includes(userRole)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear contenido' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      categoryId,
      topic,
      createdBy,
      userId,
      source = 'human',
      editorialTeamType,
      authorName,
      authorPosition,
      featuredImageKey,
      imageMetadata,
    } = body;

    // Validate required fields
    if (!title || !content || !categoryId || !topic || !createdBy || !userId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length < 50) {
      return NextResponse.json(
        { error: 'El contenido debe tener al menos 50 caracteres' },
        { status: 400 }
      );
    }

    // Validate editorial team data if source is human
    if (source === 'human') {
      if (!editorialTeamType || !authorName) {
        return NextResponse.json(
          { error: 'Faltan datos del equipo editorial' },
          { status: 400 }
        );
      }

      if (editorialTeamType === 'person' && !authorPosition) {
        return NextResponse.json(
          { error: 'El cargo/posición es requerido para personas' },
          { status: 400 }
        );
      }
    }

    // Generate unique slug from title
    const timestamp = Date.now();
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}-${timestamp}`;

    // Generate unique ID
    const postId = `post_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    const now = new Date();

    // Create the blog post using Prisma client
    const createdPost = await prisma.blog_posts.create({
      data: {
        id: postId,
        title,
        slug,
        content,
        categoryId,
        topic,
        format: null,
        source,
        editorialTeamType,
        authorName,
        authorPosition,
        featuredImageKey,
        imageMetadata,
        status: 'review',
        createdBy,
        userId,
        generatedAt: now,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Get category details
    const category = await prisma.categories.findUnique({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      post: {
        ...createdPost,
        category: category || null,
      },
    });
  } catch (error) {
    console.error('Error creating human content:', error);
    return NextResponse.json(
      { error: 'Error al crear el contenido' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}