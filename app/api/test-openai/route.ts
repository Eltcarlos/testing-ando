import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';

export async function GET() {
  try {
    console.log('Testing OpenAI connection...');
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 20));

    const result = streamText({
      model: openai('gpt-4o'),
      prompt: 'Say "Hello, World!" in Spanish.',
      maxOutputTokens: 50,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('OpenAI test error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    }, { status: 500 });
  }
}
