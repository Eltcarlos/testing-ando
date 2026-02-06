import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Definir permisos de rutas basados en roles
const rolePermissions: Record<string, string[]> = {
  "/analytics": ["admin", "partner"],
  "/cursos": ["admin", "partner", "member", "strategic_partner"],
  "/videos": ["admin", "partner", "member", "strategic_partner"],
  "/users": ["admin"],
  "/contenido": ["admin", "partner", "strategic_partner"],
  "/founder-forms": ["admin"],
  "/onboarding-questions": ["admin"],
  "/api/admin/content": ["admin", "partner", "strategic_partner"],
  "/api/admin/onboarding-questions": ["admin"],
};

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request as any,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = Boolean(token);
  const { pathname } = request.nextUrl;

  const isOnLogin = pathname.startsWith("/login");

  const isOnboarding =
    pathname.startsWith("/onboarding/partners") ||
    pathname.startsWith("/api/onboarding") ||
    pathname.startsWith("/api/forms");

  const isPublicBlogAPI = pathname.startsWith("/api/blog");
  
  // 1. No autenticado → login
  if (!isLoggedIn && !isOnLogin && !isOnboarding && !isPublicBlogAPI) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Autenticado → fuera de /login
  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Permisos por rol
  if (isLoggedIn && token) {
    const userRole = (token as any).role as string;

    for (const [route, allowedRoles] of Object.entries(rolePermissions)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL("/cursos", request.url));
        }
        break;
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|.*\\.(?:js|css|map|json|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|ico)$).*)",
  ],
};

