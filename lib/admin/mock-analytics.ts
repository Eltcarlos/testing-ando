import type { PlatformAnalytics } from '@/types/admin';

export const mockAnalytics: PlatformAnalytics = {
  users: {
    total: 1247,
    newThisMonth: 156,
    activeUsers: 892,
    churnRate: 3.2,
    growthRate: 14.3,
    byRole: {
      member: 1108,
      admin: 5,
      partner: 134,
      strategic_partner: 0,
    },
    byStatus: {
      active: 1183,
      inactive: 48,
      suspended: 16,
    },
  },
  courses: {
    totalPublished: 42,
    totalDrafts: 8,
    totalArchived: 3,
    totalViews: 18492,
    totalEnrollments: 3847,
    averageCompletionRate: 68.4,
    averageRating: 4.6,
    popularCategories: [
      { category: 'Finanzas', count: 12 },
      { category: 'Marketing Digital', count: 9 },
      { category: 'Ventas', count: 7 },
      { category: 'Legal', count: 6 },
      { category: 'Operaciones', count: 5 },
      { category: 'Capital Humano', count: 2 },
      { category: 'Tecnología', count: 1 },
    ],
  },
  activity: {
    connectionsMade: 2348,
    eventsAttended: 856,
    messagesSent: 5423,
    diagnosticsCompleted: 1089,
    matchesCreated: 1876,
  },
  period: {
    start: new Date('2024-11-01'),
    end: new Date('2024-12-11'),
    label: 'Últimos 30 días',
  },
};
