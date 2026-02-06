import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { category, existingTopics, count = 5 } = await req.json();

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const result = await generateText({
      model: openai('gpt-4o'),
      output: Output.object({
        schema: z.object({
          topics: z.array(z.string()).describe('Lista de temas sugeridos'),
        }),
      }),
      prompt: `
Eres el editor de contenido de Crece Mi Negocio, plataforma para PyMEs mexicanas.

Categoría: ${category.label}

Temas que YA existen (no los repitas ni hagas variaciones obvias):
${existingTopics.map((t: string) => `- ${t}`).join('\n')}

Genera ${count} temas NUEVOS para artículos de blog en esta categoría.

Criterios:
- Prácticos y accionables para empresarios PyME
- Específicos, no genéricos
- Relevantes para el contexto mexicano
- Diferentes a los existentes (no variaciones)
- Formato: afirmación o pregunta que se responde (ej: "Cómo calcular X", "5 errores en Y", "Qué hacer cuando Z")
      `.trim(),
    });

    return NextResponse.json(result.output);
  } catch (error) {
    console.error('Error suggesting topics:', error);
    return NextResponse.json({ error: 'Failed to suggest topics' }, { status: 500 });
  }
}
