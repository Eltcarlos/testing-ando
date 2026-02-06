import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'
import { getBaseUrl } from '@/lib/get-base-url'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '10')));
    const search = url.searchParams.get('search') || undefined;
    const role = url.searchParams.get('role') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          companyName: true,
          phone: true,
          status: true,
          role: true,
          god: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({ data: users, total, page, limit });
  } catch (err) {
    console.error('GET /api/users error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, role, companyName, phone, status } = body;

    // Validation
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        role: role || 'partner',
        companyName: companyName || null,
        phone: phone || null,
        status: status || 'active',
        god: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        companyName: true,
        phone: true,
        status: true,
        role: true,
        god: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send welcome email
    const baseUrl = await getBaseUrl();
    await sendEmail({
      type: 'welcome',
      data: {
        to: email,
        userName: fullName,
        loginUrl: `${baseUrl}/login`
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error('POST /api/users error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
