"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useUsersStore } from "@/store/usersStore";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isLoginPage = pathname === "/login";
  const isPublicFormPage = pathname.startsWith("/forms/") || pathname.startsWith("/onboarding/");
  const isLoading = useUsersStore((s) => s.isLoading);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirigir a socios que no han completado el onboarding
  useEffect(() => {
    if (session?.user && !isPublicFormPage && !isLoginPage) {
      const user = session.user as any;
      if (user.role === 'partner' && !user.onboardingCompleted) {
        router.replace('/onboarding/partners');
      }
    }
  }, [session, isPublicFormPage, isLoginPage, router]);

  // Login page - no layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Public form pages - clean public layout
  if (isPublicFormPage) {
    if (pathname.startsWith("/onboarding/")) {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {children}
        </div>
      </div>
    );
  }

  // Show app-styled loader while users are being initialized
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
          {mounted && (
            <div className="text-sm text-muted-foreground">Cargando datos de usuario...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <main className="flex-1 w-full">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
