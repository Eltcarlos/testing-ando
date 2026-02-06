import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AVAILABLE_ICONS } from '@/types/editorial';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { existingCategories, hint, adminEmail: bodyEmail } = body;
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const adminEmail = bodyEmail || searchParams.get('adminEmail') || session?.user?.email;

    console.log('[suggest-category] Request received:', { bodyEmail, hasExistingCategories: !!existingCategories, hint });

    if (!adminEmail) {
      console.error('[suggest-category] No admin email provided');
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 });
    }

    console.log('[suggest-category] Calling OpenAI to generate category...');

    // Generate category suggestion using AI
    const result = await generateText({
      model: openai('gpt-4o'),
      output: Output.object({
        schema: z.object({
          category: z.object({
            slug: z.string().describe('Slug en minúsculas, sin espacios, con guiones'),
            label: z.string().describe('Nombre legible de la categoría'),
            icon: z.enum(AVAILABLE_ICONS).describe('Icono de Lucide React'),
            topics: z.array(z.string()).length(8).describe('8 temas iniciales para la categoría'),
          }),
        }),
      }),
      prompt: `
Eres el editor de contenido de Crece Mi Negocio, plataforma para PyMEs mexicanas.

Categorías que YA existen:
${existingCategories.map((c: any) => `- ${c.label}`).join('\n')}

${hint ? `El admin sugiere explorar algo relacionado con: ${hint}` : 'Sugiere una categoría completamente nueva que sería útil.'}

Genera UNA categoría nueva que:
- Sea relevante para PyMEs mexicanas
- No se solape con las existentes
- Tenga suficiente profundidad para 8+ artículos
- Sea práctica y accionable

Iconos disponibles: ${AVAILABLE_ICONS.join(', ')}
      `.trim(),
    });

    console.log('[suggest-category] AI generated category:', result.output.category);
    console.log('[suggest-category] Creating category in database...');

    // Check if category with this slug already exists (using findFirst since slug is no longer unique)
    const existingCategory = await prisma.categories.findFirst({
      where: { slug: result.output.category.slug },
    });

    if (existingCategory) {
      console.log('[suggest-category] Category with slug already exists:', result.output.category.slug);
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese slug. Intenta de nuevo.' },
        { status: 409 }
      );
    }

    // Create the category in the database
    const newCategory = await prisma.categories.create({
      data: {
        ...result.output.category,
        createdBy: adminEmail,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('[suggest-category] Category created successfully:', newCategory.slug);

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error('[suggest-category] Error:', error);
    console.error('[suggest-category] Error stack:', error.stack);

    // Handle duplicate slug error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese slug. Intenta de nuevo.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to suggest category' },
      { status: 500 }
    );
  }
}
