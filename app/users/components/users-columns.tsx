'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Ban, CheckCircle, Send, CheckCircle2, Clock, Mail } from 'lucide-react';
import type { AdminUser, AliadosInvitationStatus } from '@/types/admin';
import Image from 'next/image';

interface ColumnMeta {
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onSendAliadosForm?: (user: AdminUser) => void;
  aliadosInvitations?: Record<string, AliadosInvitationStatus>;
}

export const getUserColumns = (meta: ColumnMeta): ColumnDef<AdminUser>[] => [
  {
    accessorKey: 'name',
    header: 'Usuario',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Rol',
    cell: ({ row }) => {
      const role = row.original.role;
      // Importa la función getRoleLabel
      // Los colores pueden ser extendidos si hay más roles
      const roleColors: Record<string, string> = {
        member: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
        admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
        partner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        strategic_partner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      };
      // Lazy import para evitar error circular
      const { getRoleLabel } = require('@/lib/admin/navigation-config');
      return (
        <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
          {getRoleLabel(role) || role}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'company',
    header: 'Empresa',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div>
          <div className="font-medium">{user.company}</div>
          {user.industry && (
            <div className="text-sm text-muted-foreground">{user.industry}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'joinedAt',
    header: 'Fecha de Registro',
    cell: ({ row }) => {
      const date = row.original.joinedAt;
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
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
        <Badge className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      );
    },
  },
  {
    id: 'aliadosForm',
    header: 'Formulario Aliados',
    cell: ({ row }) => {
      const user = row.original;

      // Only show for partner role
      if (user.role !== 'partner') {
        return <span className="text-sm text-muted-foreground">-</span>;
      }

      const invitationStatus = meta.aliadosInvitations?.[user.id];

      if (!invitationStatus) {
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => meta.onSendAliadosForm?.(user)}
            className="gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar formulario
          </Button>
        );
      }

      const statusConfig: Record<AliadosInvitationStatus, { label: string; icon: React.ReactNode; className: string }> = {
        pending: {
          label: 'Pendiente',
          icon: <Clock className="h-3.5 w-3.5" />,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        },
        sent: {
          label: 'Enviado',
          icon: <Mail className="h-3.5 w-3.5" />,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
        },
        opened: {
          label: 'Abierto',
          icon: <Eye className="h-3.5 w-3.5" />,
          className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
        },
        completed: {
          label: 'Completado',
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        },
      };

      const config = statusConfig[invitationStatus];

      return (
        <Badge className={`${config.className} gap-1.5`}>
          {config.icon}
          {config.label}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta.onView(user)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta.onEdit(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar usuario
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta.onToggleStatus(user)}>
              {user.status === 'active' ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Desactivar usuario
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activar usuario
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
