'use client';

import { StatCard } from '@/components/admin/StatCard';
import { mockAnalytics } from '@/lib/admin/mock-analytics';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BusinessDashboard } from '@/components/admin/BusinessDashboard';
import {
  Users,
  UserPlus,
  Activity,
  TrendingDown,
  BookOpen,
  FileText,
  Eye,
  CheckCircle,
  Network,
  Calendar,
  MessageSquare,
  ClipboardCheck,
  Handshake,
  BarChart3,
  Map,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { users, courses, activity, period } = mockAnalytics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análisis</h1>
          <p className="text-muted-foreground mt-1">{period.label}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Resumen General
          </TabsTrigger>
          <TabsTrigger value="business">
            <Map className="mr-2 h-4 w-4" />
            Dashboard Empresarial
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Existing overview content */}
          <div>

      {/* User Statistics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Estadísticas de Usuarios</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Usuarios"
            value={users.total.toLocaleString()}
            icon={Users}
            description="Usuarios registrados en la plataforma"
          />
          <StatCard
            title="Nuevos Este Mes"
            value={users.newThisMonth}
            change={`+${users.growthRate}% vs mes anterior`}
            changeType="positive"
            icon={UserPlus}
          />
          <StatCard
            title="Usuarios Activos"
            value={users.activeUsers.toLocaleString()}
            description={`${((users.activeUsers / users.total) * 100).toFixed(1)}% del total`}
            icon={Activity}
          />
          <StatCard
            title="Tasa de Abandono"
            value={`${users.churnRate}%`}
            change="Objetivo: < 5%"
            changeType="positive"
            icon={TrendingDown}
          />
        </div>
      </div>

      {/* Course Statistics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Estadísticas de Cursos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Cursos Publicados"
            value={courses.totalPublished}
            description={`${courses.totalDrafts} borradores`}
            icon={BookOpen}
          />
          <StatCard
            title="Total de Vistas"
            value={courses.totalViews.toLocaleString()}
            change={`Promedio: ${Math.round(courses.totalViews / courses.totalPublished)} por curso`}
            changeType="neutral"
            icon={Eye}
          />
          <StatCard
            title="Inscripciones"
            value={courses.totalEnrollments.toLocaleString()}
            description="Usuarios inscritos en cursos"
            icon={FileText}
          />
          <StatCard
            title="Tasa de Completitud"
            value={`${courses.averageCompletionRate}%`}
            change={`Rating promedio: ${courses.averageRating}/5`}
            changeType="positive"
            icon={CheckCircle}
          />
        </div>

        {/* Popular Categories */}
        <div className="mt-6 bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Categorías Más Populares</h3>
          <div className="space-y-3">
            {courses.popularCategories.map((cat, index) => {
              const percentage = (cat.count / courses.totalPublished) * 100;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">
                      {cat.count} cursos ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Actividad en la Plataforma</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Conexiones Realizadas"
            value={activity.connectionsMade.toLocaleString()}
            icon={Network}
            description="Empresas conectadas"
          />
          <StatCard
            title="Eventos Asistidos"
            value={activity.eventsAttended.toLocaleString()}
            icon={Calendar}
            description="Participantes en eventos"
          />
          <StatCard
            title="Mensajes Enviados"
            value={activity.messagesSent.toLocaleString()}
            icon={MessageSquare}
            description="Conversaciones activas"
          />
          <StatCard
            title="Diagnósticos Completados"
            value={activity.diagnosticsCompleted.toLocaleString()}
            icon={ClipboardCheck}
            description="Perfiles evaluados"
          />
          <StatCard
            title="Matches Creados"
            value={activity.matchesCreated.toLocaleString()}
            icon={Handshake}
            description="Coincidencias exitosas"
          />
        </div>
      </div>

      {/* User Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Distribución por Rol</h3>
          <div className="space-y-3">
            {Object.entries(users.byRole)
              .filter(([role]) => role !== 'moderator')
              .map(([role, count]) => {
                const percentage = (count / users.total) * 100;
                const roleLabels: Record<string, string> = {
                  member: 'Miembros',
                  admin: 'Administradores',
                  partner: 'Aliados',
                };
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-medium">{roleLabels[role]}</span>
                      <span className="text-muted-foreground">
                        {count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Estado de Usuarios</h3>
          <div className="space-y-3">
            {Object.entries(users.byStatus).map(([status, count]) => {
              const percentage = (count / users.total) * 100;
              const statusLabels: Record<string, string> = {
                active: 'Activos',
                inactive: 'Inactivos',
                suspended: 'Suspendidos',
              };
              const statusColors: Record<string, string> = {
                active: 'bg-green-600',
                inactive: 'bg-gray-400',
                suspended: 'bg-red-600',
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium">{statusLabels[status]}</span>
                    <span className="text-muted-foreground">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${statusColors[status]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
          </div>
        </TabsContent>

        {/* Business Dashboard Tab */}
        <TabsContent value="business">
          <BusinessDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
