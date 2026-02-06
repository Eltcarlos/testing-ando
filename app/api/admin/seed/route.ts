import { seedAdmin } from '@/lib/content/seed-admin';
import { NextRequest } from 'next/server';

/**
 * API endpoint to seed a new admin with default categories
 * POST /api/admin/seed
 * Body: { email: string, name?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const admin = await seedAdmin(email, name || 'Admin');

    if (!admin) {
      return Response.json(
        { error: 'Failed to create admin' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        categoriesCount: admin.contentEditorial.categories.length,
      },
    });
  } catch (error: any) {
    console.error('Error in seed route:', error);
    return Response.json(
      { error: error.message || 'Failed to seed admin' },
      { status: 500 }
    );
  }
}
