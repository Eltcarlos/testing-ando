'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UsersDataTable } from './components/UsersDataTable';
import { UserDetailsDialog } from './components/UserDetailsDialog';
import { EditUserDialog } from './components/EditUserDialog';
import { CreateUserDialog } from './components/CreateUserDialog';
import type { AdminUser, UserFormData, AliadosInvitationStatus } from '@/types/admin';
import { toast } from 'sonner';

// TODO: This should come from the database in production
const DEFAULT_ALIADOS_FORM_ID = 'default-aliados-form-id';

export default function UsersAdminPage() {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aliadosInvitations, setAliadosInvitations] = useState<Record<string, AliadosInvitationStatus>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger table refresh
  const refreshTable = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      toast.success(`Estado del usuario actualizado a ${newStatus}`);
      refreshTable();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error al actualizar el estado del usuario');
    }
  };

  const handleSendAliadosForm = async (user: AdminUser) => {
    const toastId = toast.loading(`Enviando formulario de Aliados a ${user.name}...`);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/send-aliados-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: DEFAULT_ALIADOS_FORM_ID,
          userEmail: user.email,
          userName: user.name,
          userCompany: user.company,
          sentBy: 'admin', // TODO: Replace with actual admin user ID from session
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send form');
      }

      const data = await response.json();

      // Update the invitations state
      setAliadosInvitations(prev => ({
        ...prev,
        [user.id]: data.invitation.status,
      }));

      toast.success(`El formulario de Aliados ha sido enviado exitosamente a ${user.name}`, { id: toastId });
    } catch (error) {
      console.error('Error sending Aliados form:', error);
      toast.error('No se pudo enviar el formulario. Por favor intenta de nuevo.', { id: toastId });
    }
  };

  const handleSaveUser = async (data: UserFormData) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.name,
          email: data.email,
          role: data.role,
          companyName: data.company,
          phone: data.phone,
          status: data.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast.success('Usuario actualizado exitosamente');
      setEditDialogOpen(false);
      refreshTable();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Error al actualizar el usuario');
    }
  };

  const handleCreateUser = async (data: { name: string; email: string; role: any }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.name,
          email: data.email,
          role: data.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toast.success('Usuario creado exitosamente');
      setCreateDialogOpen(false);
      refreshTable();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Error al crear el usuario');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra los usuarios de la plataforma
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Users Table */}
      <UsersDataTable
        key={refreshTrigger}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onToggleStatus={handleToggleStatus}
        onSendAliadosForm={handleSendAliadosForm}
        aliadosInvitations={aliadosInvitations}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveUser}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreateUser}
      />
    </div>
  );
}
