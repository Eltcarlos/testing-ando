"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavigationForRole, getRoleLabel } from "@/lib/admin/navigation-config";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthStore, User } from "@/store/authStore";
import { useUsersStore } from "@/store/usersStore";
import { signOut } from "next-auth/react";
import type { AdminUser } from "@/types/admin";

/** Sidebar content shared between desktop and mobile */
function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const authUser = useAuthStore((s) => s.user);
  const { currentUser, switchUser, setUser } = useUsersStore();
  const [usersList, setUsersList] = useState<any[]>([]);

  // Sync currentUser with authUser if not set
  useEffect(() => {
    if (authUser && !currentUser) {
      const mapped = {
        id: authUser.id,
        name: authUser.fullName || authUser.email,
        email: authUser.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser.fullName || authUser.email)}`,
        role: authUser.role || 'member', // Preservar el rol original
        company: authUser.companyName || '',
        phone: '',
        joinedAt: new Date(),
        status: authUser.status as any || 'active',
        metrics: {
          coursesEnrolled: 0,
          coursesCompleted: 0,
          connectionsCount: 0,
          eventsAttended: 0,
          messagesCount: 0,
        },
        settings: {
          emailNotifications: true,
          profileVisibility: 'public',
          allowMessages: true,
        },
      } as AdminUser;
      setUser(mapped);
    }
  }, [authUser, currentUser, setUser]);

  // Fetch users for the dropdown list - ONLY for admins
  useEffect(() => {
    const isAdmin = authUser?.role === 'admin';
    if (!isAdmin) {
      setUsersList([]);
      return;
    }

    let mounted = true;
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users?limit=100'); // Get more users for the dropdown
        if (res.ok) {
          const response = await res.json();
          const users = response.data || response; // Handle both old and new format
          if (!mounted) return;
          setUsersList(users.map((u: any) => ({
            id: u.id,
            name: u.fullName || u.name || u.email,
            email: u.email,
            avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || u.email)}`,
            role: u.role,
          })));
        }
      } catch (e) {
        console.warn('AdminSidebar: could not fetch users', e);
      }
    }
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, [authUser]);

  if (!currentUser) return null;

  const isAdmin = authUser?.role === 'admin';
  const navigation = getNavigationForRole(currentUser.role);
  const userInitials = (currentUser.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Group fetched users by role for the dropdown
  const usersByRole = usersList.reduce((acc: Record<string, any[]>, user) => {
    acc[user.role] = acc[user.role] || [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-auto py-3 hover:bg-muted">
                    <div className="flex items-center gap-3 w-full text-foreground opacity-100">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={currentUser.avatar}
                          alt={currentUser.name}
                        />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate w-full">
                          {currentUser.name}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {getRoleLabel(currentUser.role)}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-popper-anchor-width]"
                  align="start"
                >
                  {Object.entries(usersByRole).map(([role, users]) => (
                    <div key={role}>
                      <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                        {getRoleLabel(role as any)}
                      </DropdownMenuLabel>
                      {users.map((user) => (
                        <DropdownMenuItem
                          key={user.id}
                          onClick={() => void switchUser(user.id)}
                          className={cn(
                            "cursor-pointer",
                            currentUser.id === user.id && "bg-accent"
                          )}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n: any) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm truncate">{user.name}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton className="h-auto py-3 cursor-default hover:bg-transparent">
                <div className="flex items-center gap-3 w-full text-foreground opacity-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser.avatar}
                      alt={currentUser.name}
                    />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate w-full">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="p-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-muted"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        {/* <ThemeToggle /> */}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground truncate">
            {currentUser.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={async () => {
              // 1. Clear local context/selection stores
              useAuthStore.getState().logout();
              useUsersStore.getState().setUser(null as any);
              localStorage.removeItem('users-storage');
              localStorage.removeItem('current_user_id');
              localStorage.removeItem('auth-storage');

              // 2. Clear NextAuth session and redirect to login
              await signOut({
                callbackUrl: '/login',
                redirect: true
              });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { AdminSidebarContent as AdminSidebar };
