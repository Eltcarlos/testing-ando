'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Archive, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FounderFormWithDetails } from '@/types/founder-form';
import { FormStatus } from '@prisma/client';

export default function FounderFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FounderFormWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');

  useEffect(() => {
    fetchForms();
  }, [statusFilter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/founder-forms?${params}`);
      const data = await response.json();

      if (data.data) {
        setForms(data.data);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (formId: string) => {
    if (!confirm('¿Está seguro de que desea archivar este formulario?')) {
      return;
    }

    try {
      await fetch(`/api/admin/founder-forms/${formId}`, {
        method: 'DELETE',
      });

      fetchForms();
    } catch (error) {
      console.error('Error archiving form:', error);
    }
  };

  const getStatusBadge = (status: FormStatus) => {
    const variants: Record<FormStatus, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Borrador' },
      active: { variant: 'default', label: 'Activo' },
      archived: { variant: 'outline', label: 'Archivado' },
    };

    const config = variants[status];

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Formularios para Empresas Fundadoras
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestione formularios dinámicos para socios inversores
          </p>
        </div>

       {
        /*
         <Link href="/founder-forms/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Formulario
          </Button>
        </Link>
        */
       }
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as FormStatus | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando formularios...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay formularios. Cree uno nuevo para comenzar.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Respuestas</TableHead>
                <TableHead>Última edición</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow
                  key={form.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/founder-forms/${form.id}`)}
                >
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>{getStatusBadge(form.status)}</TableCell>
                  <TableCell>{form._count?.responses || 0}</TableCell>
                  <TableCell>{formatDate(form.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/founder-forms/${form.id}/invitations`}>
                        <Button variant="default" size="sm">
                          Invitaciones
                        </Button>
                      </Link>

                      <Link href={`/founder-forms/${form.id}/analytics`}>
                        <Button variant="ghost" size="sm" title="Analytics">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {form.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(form.id)}
                          title="Archivar"
                        >
                          <Archive className="h-4 w-4" />
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
    </div>
  );
}
