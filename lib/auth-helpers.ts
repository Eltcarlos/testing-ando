import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Get the current authenticated user session
 * Use this in Server Components
 */
export async function getCurrentUser() {
    const session = await auth();
    return session?.user;
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireAuth() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return session.user;
}

/**
 * Check if user is authenticated
 * Use this in Server Components
 */
export async function isAuthenticated() {
    const session = await auth();
    return !!session?.user;
}
