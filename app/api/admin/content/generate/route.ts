import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ContentFormat, PromptCustomization } from '@/types/editorial';
import { getFormatPrompt, getFormatWordCount } from '@/lib/content/formats';
import { buildCustomizedPrompt } from '@/lib/content/prompt-builder';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    console.log('[generate] POST request received');

    const body = await req.json();
    console.log('[generate] Request body:', body);

    const { category, topic, format, customTopic, customization } = body;

    const finalTopic = customTopic || topic;

    console.log('[generate] Request received:', {
      category: category?.label,
      topic,
      customTopic,
      finalTopic,
      format
    });

    if (!finalTopic || !category || !format) {
      console.error('[generate] Missing required fields:', { finalTopic, category, format });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[generate] Calling OpenAI to generate content...');

    const systemPrompt = buildSystemPrompt(format as ContentFormat, category.label, customization as PromptCustomization);

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Genera contenido sobre: ${finalTopic}`,
      maxOutputTokens: 2500,
    });

    console.log('[generate] Streaming response started');

    // Return the proper text stream response for useCompletion
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('[generate] Error:', error);
    console.error('[generate] Error message:', error.message);
    console.error('[generate] Error stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message || 'Error generating content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function buildSystemPrompt(format: ContentFormat, categoryLabel: string, customization?: PromptCustomization): string {
  const formatInstructions = getFormatPrompt(format);

  // Get word count for the format
  const wordCountRange = getFormatWordCount(format);
  const wordCount = { min: wordCountRange[0], max: wordCountRange[1] };

  const baseSystemPrompt = `
Eres el editor de contenido del blog de Crece Mi Negocio, una plataforma para PyMEs mexicanas.

## Categoría actual
${categoryLabel}

## Reglas de estilo
- Español mexicano, profesional pero cercano
- Tutea al lector
- Ejemplos que un empresario mexicano reconozca
- Si mencionas regulaciones, que sean mexicanas (SAT, IMSS, STPS, IMPI, etc.)
- Cero jerga corporativa vacía
- Práctico > teórico
- Markdown para formato

## Output
Solo el artículo. Sin preámbulos, sin explicaciones.
  `.trim();

  // If customization is provided, build a customized prompt
  if (customization && Object.keys(customization).length > 0) {
    console.log('[generate] Applying customizations:', customization);
    return buildCustomizedPrompt(baseSystemPrompt, formatInstructions, wordCount, customization);
  }

  // Otherwise, return the standard prompt
  return `${baseSystemPrompt}\n\n## Formato requerido\n${formatInstructions}`;
}
