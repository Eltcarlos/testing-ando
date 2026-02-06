"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUsersStore } from "@/store/usersStore";

export default function UsersInitializer() {
  const authUser = useAuthStore((s) => s.user);
  const { currentUser, setUser, setLoading } = useUsersStore();

  useEffect(() => {
    async function init() {
      // If we already have a currentUser, ensure loading is false and don't force a re-sync
      // This allows the "Switch User" feature to work without being overridden
      if (currentUser) {
        setLoading(false);
        return;
      }

      // If there's an authenticated user, prefer mapping by email
      if (authUser?.email) {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const response = await res.json();
            const users = response.data || response;
            const matched = users.find((u: any) => u.email === authUser.email);
            if (matched) {
              setUser(mapApiUserToAdminUser(matched));
              return;
            }
          }
        } catch (e) {
          console.warn('UsersInitializer: could not fetch users', e);
        }
        // If we couldn't find the user, still set loading to false
        setLoading(false);
        return;
      }

      // Fallback to localStorage persisted selection
      try {
        const storedId = localStorage.getItem("current_user_id");
        if (storedId) {
          const res = await fetch('/api/users');
          if (res.ok) {
            const response = await res.json();
            const users = response.data || response;
            const u = users.find((m: any) => m.id === storedId);
            if (u) {
              setUser(mapApiUserToAdminUser(u));
              return;
            }
          }
        }
      } catch (e) {
        // ignore (SSR-safe)
      }

      // No authenticated user and no stored user found - set loading to false
      // to allow server-side redirects to work
      setLoading(false);
    }

    init();
  }, [authUser, currentUser, setUser, setLoading]);

  function mapApiUserToAdminUser(u: any) {
    return {
      id: u.id,
      name: u.fullName || u.name || u.email,
      email: u.email,
      avatar:
        u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || u.email)}`,
      role: u.role || 'member', // Preservar el rol original de la base de datos
      company: u.companyName || u.company || '',
      phone: u.phone || '',
      joinedAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      lastActive: u.updatedAt ? new Date(u.updatedAt) : undefined,
      status: (u.status === 'active' || u.status === 'inactive' || u.status === 'suspended') ? u.status : 'active',
      metrics: u.metrics || {
        coursesEnrolled: 0,
        coursesCompleted: 0,
        connectionsCount: 0,
        eventsAttended: 0,
        messagesCount: 0,
      },
      settings: u.settings || { emailNotifications: true, profileVisibility: 'public', allowMessages: true },
    } as any;
  }

  return null;
}
