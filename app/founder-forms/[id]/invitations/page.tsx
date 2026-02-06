'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Send, Copy, Trash2, MailOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvitationStatus } from '@prisma/client';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string | null;
  status: InvitationStatus;
  token: string;
  sentAt: Date | null;
  openedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface Form {
  id: string;
  name: string;
  description: string | null;
}

export default function InvitationsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    contactName: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchForm();
    fetchInvitations();
  }, [formId, statusFilter]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/admin/founder-forms/${formId}`);
      const data = await response.json();
      setForm(data);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Error al cargar el formulario');
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(
        `/api/admin/founder-forms/${formId}/invitations?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.data && Array.isArray(data.data)) {
        setInvitations(data.data);
      } else {
        console.error('Unexpected data format:', data);
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Error al cargar invitaciones');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/admin/founder-forms/${formId}/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear invitación');
      }

      toast.success('Invitación creada exitosamente');
      setShowAddDialog(false);
      setFormData({
        email: '',
        companyName: '',
        contactName: '',
        phone: '',
      });
      fetchInvitations();
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast.error(error.message || 'Error al crear invitación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/founder-forms/${formId}/invitations/${invitationId}/send`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar invitación');
      }

      toast.success('Invitación enviada exitosamente');

      // In development, show the link
      if (data.devLink) {
        toast.info(`Link de prueba: ${data.devLink}`, {
          duration: 10000,
        });
      }

      fetchInvitations();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Error al enviar invitación');
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/forms/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado al portapapeles');
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta invitación?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/founder-forms/${formId}/invitations/${invitationId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar invitación');
      }

      toast.success('Invitación eliminada');
      fetchInvitations();
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast.error(error.message || 'Error al eliminar invitación');
    }
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const variants: Record<
      InvitationStatus,
      { variant: any; label: string }
    > = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      sent: { variant: 'default', label: 'Enviada' },
      opened: { variant: 'default', label: 'Abierta' },
      completed: { variant: 'default', label: 'Completada' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate statistics
  const stats = {
    total: invitations.length,
    pending: invitations.filter((i) => i.status === 'pending').length,
    sent: invitations.filter((i) => i.status === 'sent').length,
    opened: invitations.filter((i) => i.status === 'opened').length,
    completed: invitations.filter((i) => i.status === 'completed').length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Link href={`/founder-forms/${formId}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al formulario
        </Button>
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Invitaciones - {form?.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestione las invitaciones para completar este formulario
          </p>
        </div>

        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Invitación
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pendientes</div>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Enviadas</div>
          <div className="text-2xl font-bold">{stats.sent}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Abiertas</div>
          <div className="text-2xl font-bold">{stats.opened}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Completadas</div>
          <div className="text-2xl font-bold">{stats.completed}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="mb-4">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as InvitationStatus | 'all')
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="opened">Abierta</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando invitaciones...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay invitaciones. Cree una nueva para comenzar.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enviada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.companyName}
                  </TableCell>
                  <TableCell>{invitation.contactName}</TableCell>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{invitation.phone || '-'}</TableCell>
                  <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                  <TableCell>{formatDate(invitation.sentAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invitation.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendInvitation(invitation.id)}
                          title="Enviar invitación"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}

                      {invitation.status === 'sent' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendInvitation(invitation.id)}
                          title="Reenviar invitación"
                        >
                          <MailOpen className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(invitation.token)}
                        title="Copiar link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {invitation.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Invitation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Invitación</DialogTitle>
            <DialogDescription>
              Agregue los datos del fundador para enviar la invitación
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddInvitation}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="companyName">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactName">
                  Nombre del Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Invitación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
