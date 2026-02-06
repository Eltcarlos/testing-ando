import { NextRequest, NextResponse } from 'next/server';

// News API configuration
const NEWS_API_TOKEN = process.env.NEWS_API_TOKEN;
const NEWS_HOST = "https://do5fu7aisi.execute-api.us-east-2.amazonaws.com/default/newsapi";

/**
 * Parse a date string from the news API format to a Date object
 */
function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Process the API response and format dates
 */
function processResponse(data: any[]): any[] {
  const processed = data.map(item => ({
    ...item,
    date_iso: parseDate(item.date).toISOString().split('T')[0]
  }));

  // Sort by date in descending order
  return processed.sort((a, b) =>
    new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime()
  );
}

/**
 * Make a request to the news API
 */
async function newsRequest(
  keyphrase: string,
  startDate?: string,
  endDate?: string,
  num: number = 15
): Promise<any[]> {
  const lang = "hl=es-419&gl=MX&ceid=MX:es-419";

  let query = keyphrase;

  // Add date filters to query if present
  if (startDate) {
    query += ` after:${startDate}`;
  }

  if (endDate) {
    query += ` before:${endDate}`;
  }

  // Request body for the API
  const body = {
    token: NEWS_API_TOKEN,
    procedure: 'search',
    query: query,
    num: String(num),
    lang: lang
  };

  const response = await fetch(NEWS_HOST, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('Failed to fetch news');
  }

  const data = await response.json();
  return processResponse(data);
}

/**
 * Query news based on keywords and date range
 */
async function consultaNoticias(
  keywords: string = '(seguridad OR crimen OR violencia OR policia) AND celaya',
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  let start = startDate;
  let end = endDate;

  // If no start date specified, use last 15 days
  if (!start) {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    start = fifteenDaysAgo.toISOString().split('T')[0];
    end = now.toISOString().split('T')[0];
  }

  // Make the news request
  const urls = await newsRequest(keywords, start, end);

  // Transform into document-like structure
  const data = urls.map(item => ({
    content: item.title,
    metadata: {
      link: item.link,
      date: item.date,
      source_name: item.source_name,
      date_iso: item.date_iso
    }
  }));

  return data;
}

/**
 * GET /api/news
 * Query parameters:
 * - keywords: Search keywords (optional)
 * - startDate: Start date in YYYY-MM-DD format (optional)
 * - endDate: End date in YYYY-MM-DD format (optional)
 * - num: Number of results (optional, default: 15)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.get('keywords') || '(seguridad OR crimen OR violencia OR policia) AND celaya';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const news = await consultaNoticias(keywords, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: news,
      count: news.length
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news
 * Request body:
 * - keywords: Search keywords (optional)
 * - startDate: Start date in YYYY-MM-DD format (optional)
 * - endDate: End date in YYYY-MM-DD format (optional)
 * - num: Number of results (optional, default: 15)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keywords = '(seguridad OR crimen OR violencia OR policia) AND celaya',
      startDate,
      endDate
    } = body;

    const news = await consultaNoticias(keywords, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: news,
      count: news.length
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news'
      },
      { status: 500 }
    );
  }
}
