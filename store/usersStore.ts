import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser } from '@/types/admin';

interface UsersState {
  currentUser: AdminUser | null;
  isLoading: boolean;
  setUser: (user: AdminUser) => void;
  setLoading: (loading: boolean) => void;
  switchUser: (id: string) => Promise<void>;
  getUserRole: () => AdminUser['role'] | null;
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoading: true,
      setUser: (user: AdminUser) => set({ currentUser: user, isLoading: false }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      switchUser: async (id: string) => {
        try {
          const res = await fetch(`/api/users/${id}`);
          if (res.ok) {
            const u = await res.json();
            const mapped = {
              id: u.id,
              name: u.fullName || u.name || u.email,
              email: u.email,
              avatar:
                u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || u.email)}`,
              role: u.role, // Usa el rol real de la base de datos
              company: u.companyName || u.company || '',
              phone: u.phone || '',
              joinedAt: u.createdAt ? new Date(u.createdAt) : new Date(),
              lastActive: u.updatedAt ? new Date(u.updatedAt) : undefined,
              status: u.status || 'active',
              metrics: u.metrics || {},
              settings: u.settings || {},
            } as AdminUser;
            set({ currentUser: mapped, isLoading: false });
            try {
              localStorage.setItem('current_user_id', mapped.id);
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          console.warn('usersStore.switchUser failed', e);
        }
      },
      getUserRole: () => get().currentUser?.role || null,
    }),
    {
      name: 'users-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({} as Storage))),
    }
  )
);

export default useUsersStore;
