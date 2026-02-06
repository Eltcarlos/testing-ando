'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  BookOpen,
  Users,
  CalendarCheck,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import type { AdminUser } from '@/types/admin';
import Image from 'next/image';

interface UserDetailsDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null;

  const roleLabels: Record<string, string> = {
    member: 'Miembro',
    admin: 'Administrador',
    partner: 'Aliado',
  };

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{user.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{roleLabels[user.role]}</Badge>
                <Badge className={statusColors[user.status]}>
                  {statusLabels[user.status]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.company}</span>
              </div>
              {user.industry && (
                <div className="text-sm text-muted-foreground">
                  Industria: {user.industry}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Registrado:</span>{' '}
                  {user.joinedAt.toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              {user.lastActive && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Última actividad:</span>{' '}
                    {user.lastActive.toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métricas de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                  <BookOpen className="h-5 w-5 text-primary mb-2" />
                  <div className="text-2xl font-bold">{user.metrics.coursesEnrolled}</div>
                  <div className="text-xs text-muted-foreground">Cursos inscritos</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                  <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
                  <div className="text-2xl font-bold">{user.metrics.coursesCompleted}</div>
                  <div className="text-xs text-muted-foreground">Cursos completados</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{user.metrics.connectionsCount}</div>
                  <div className="text-xs text-muted-foreground">Conexiones</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                  <CalendarCheck className="h-5 w-5 text-purple-600 mb-2" />
                  <div className="text-2xl font-bold">{user.metrics.eventsAttended}</div>
                  <div className="text-xs text-muted-foreground">Eventos asistidos</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                  <MessageSquare className="h-5 w-5 text-orange-600 mb-2" />
                  <div className="text-2xl font-bold">{user.metrics.messagesCount}</div>
                  <div className="text-xs text-muted-foreground">Mensajes enviados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notificaciones por email:</span>
                <span className="font-medium">
                  {user.settings.emailNotifications ? 'Activadas' : 'Desactivadas'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibilidad del perfil:</span>
                <span className="font-medium capitalize">
                  {user.settings.profileVisibility === 'public'
                    ? 'Público'
                    : user.settings.profileVisibility === 'members-only'
                    ? 'Solo miembros'
                    : 'Privado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permitir mensajes:</span>
                <span className="font-medium">
                  {user.settings.allowMessages ? 'Sí' : 'No'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
