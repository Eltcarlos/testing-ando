"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { AdminUser } from "@/types/admin";

interface UserContextType {
  currentUser: AdminUser | null;
  switchUser: (userId: string) => Promise<void>;
  getUserRole: () => AdminUser["role"] | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    async function init() {
      if (status === "loading") return;

      if (session?.user?.email) {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const response = await res.json();
            const users = response.data || response;
            const matched = users.find((u: any) => u.email === session.user?.email);
            if (matched) {
              setCurrentUser({
                id: matched.id,
                name: matched.fullName || matched.name || matched.email,
                email: matched.email,
                avatar: matched.avatar,
                role: (matched.role === 'admin' || matched.role === 'partner') ? (matched.role === 'admin' ? 'admin' : 'partner') : 'member',
                company: matched.companyName || matched.company || '',
                phone: matched.phone || '',
                joinedAt: matched.createdAt ? new Date(matched.createdAt) : new Date(),
                lastActive: matched.updatedAt ? new Date(matched.updatedAt) : undefined,
                status: matched.status || 'active',
                metrics: matched.metrics || {},
                settings: matched.settings || {},
              });
            } else {
              const adminUser = users.find((u: any) => u.role === 'admin');
              if (adminUser) {
                setCurrentUser({
                  id: adminUser.id,
                  name: adminUser.fullName || adminUser.name || adminUser.email,
                  email: adminUser.email,
                  avatar: adminUser.avatar,
                  role: 'admin',
                  company: adminUser.companyName || adminUser.company || '',
                  phone: adminUser.phone || '',
                  joinedAt: adminUser.createdAt ? new Date(adminUser.createdAt) : new Date(),
                  lastActive: adminUser.updatedAt ? new Date(adminUser.updatedAt) : undefined,
                  status: adminUser.status || 'active',
                  metrics: adminUser.metrics || {},
                  settings: adminUser.settings || {},
                });
              }
            }
          }
        } catch (e) {
          console.warn('UserProvider init error', e);
        }
        setIsLoading(false);
        return;
      }

      // No session: try localStorage or fallback to API-first admin
      try {
        const storedUserId = localStorage.getItem('current_user_id');
        const res = await fetch('/api/users');
        if (res.ok) {
          const response = await res.json();
          const users = response.data || response;
          if (storedUserId) {
            const user = users.find((u: any) => u.id === storedUserId);
            if (user) {
              setCurrentUser({
                id: user.id,
                name: user.fullName || user.name || user.email,
                email: user.email,
                avatar: user.avatar,
                role: (user.role === 'admin' || user.role === 'partner') ? (user.role === 'admin' ? 'admin' : 'partner') : 'member',
                company: user.companyName || user.company || '',
                phone: user.phone || '',
                joinedAt: user.createdAt ? new Date(user.createdAt) : new Date(),
                lastActive: user.updatedAt ? new Date(user.updatedAt) : undefined,
                status: user.status || 'active',
                metrics: user.metrics || {},
                settings: user.settings || {},
              });
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('UserProvider init error', e);
      }

      setIsLoading(false);
    }

    init();
  }, [session, status]);

  const switchUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const u = await res.json();
        const mapped = {
          id: u.id,
          name: u.fullName || u.name || u.email,
          email: u.email,
          avatar: u.avatar,
          role: (u.role === 'admin' || u.role === 'partner') ? (u.role === 'admin' ? 'admin' : 'partner') : 'member',
          company: u.companyName || u.company || '',
          phone: u.phone || '',
          joinedAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          lastActive: u.updatedAt ? new Date(u.updatedAt) : undefined,
          status: u.status || 'active',
          metrics: u.metrics || {},
          settings: u.settings || {},
        } as AdminUser;
        setCurrentUser(mapped);
        localStorage.setItem('current_user_id', mapped.id);
        localStorage.setItem('admin_email', mapped.email);
      }
    } catch (e) {
      console.warn('UserProvider.switchUser failed', e);
    }
  };

  const getUserRole = () => {
    return currentUser?.role || null;
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        switchUser,
        getUserRole,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
