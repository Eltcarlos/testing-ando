'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Mail,
  Edit,
  Eye,
  FileText,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FormStatus, QuestionType } from '@prisma/client';
import { toast } from 'sonner';
import { QuestionCard } from './components/QuestionCard';
import { AddQuestionForm } from './components/AddQuestionForm';
import { EditWarning } from './components/EditWarning';

interface Question {
  id: string;
  order: number;
  section: string;
  sectionOrder: number;
  type: QuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
  };
  isArchived: boolean;
}

interface Form {
  id: string;
  name: string;
  description?: string;
  slug: string;
  status: FormStatus;
  version: number;
  questions: Question[];
  settings: {
    allowSaveDraft: boolean;
    showProgressBar: boolean;
    submitMessage?: string;
    redirectUrl?: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    responses: number;
  };
}

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    status: 'draft' as FormStatus,
  });

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/founder-forms/${formId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to fetch form');
      }

      const data = await response.json();
      setForm(data);
      setEditData({
        name: data.name,
        description: data.description || '',
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Error al cargar el formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/founder-forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('Failed to update form');
      }

      toast.success('Formulario actualizado exitosamente');
      setEditing(false);
      fetchForm();
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error('Error al actualizar el formulario');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (form) {
      setEditData({
        name: form.name,
        description: form.description || '',
        status: form.status,
      });
    }
  };

  const getStatusBadge = (status: FormStatus) => {
    const variants: Record<FormStatus, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Borrador' },
      active: { variant: 'default', label: 'Activo' },
      archived: { variant: 'outline', label: 'Archivado' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  // Group questions by section
  const groupedQuestions = form?.questions.reduce((acc, question) => {
    if (!acc[question.section]) {
      acc[question.section] = [];
    }
    acc[question.section].push(question);
    return acc;
  }, {} as Record<string, Question[]>) || {};

  // Sort sections by the order of their first question
  const sortedSections = Object.entries(groupedQuestions).sort(
    ([, questionsA], [, questionsB]) => {
      return Math.min(...questionsA.map((q) => q.order)) - Math.min(...questionsB.map((q) => q.order));
    }
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Formulario no encontrado</p>
          <Link href="/founder-forms">
            <Button className="mt-4">Volver a Formularios</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <Link href="/founder-forms">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Formularios
        </Button>
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Formulario</Label>
                <Input
                  id="name"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="max-w-2xl"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="max-w-2xl"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value: FormStatus) =>
                    setEditData({ ...editData, status: value })
                  }
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">{form.name}</h1>
              {form.description && (
                <p className="text-muted-foreground mt-2">{form.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                {getStatusBadge(form.status)}
                <span className="text-sm text-muted-foreground">
                  Versión {form.version}
                </span>
                <span className="text-sm text-muted-foreground">
                  Slug: <code className="text-xs bg-muted px-2 py-1 rounded">{form.slug}</code>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Link href={`/founder-forms/${formId}/analytics`}>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link href={`/founder-forms/${formId}/invitations`}>
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Invitaciones
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Preguntas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{form.questions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Secciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedQuestions).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preguntas Requeridas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {form.questions.filter((q) => q.required).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preguntas con Archivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {form.questions.filter((q) => q.type === 'file').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href={`/forms/${form.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa (Público)
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/forms/${form.slug}`;
                navigator.clipboard.writeText(url);
                toast.success('Link copiado al portapapeles');
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Copiar Link Público
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Warning */}
      {form._count && <EditWarning responseCount={form._count.responses} />}

      {/* Add Question Form */}
      <AddQuestionForm
        formId={formId}
        sections={Object.keys(groupedQuestions).length > 0 ? Object.keys(groupedQuestions) : ['General']}
        onSuccess={fetchForm}
      />

      {/* Questions by Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas por Sección</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {form.questions.length} preguntas organizadas en {Object.keys(groupedQuestions).length} secciones
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {sortedSections.map(([sectionName, questions], sectionIndex) => {
              const sortedQuestions = questions.sort((a, b) => a.sectionOrder - b.sectionOrder);

              return (
                <AccordionItem key={sectionName} value={`section-${sectionIndex}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{sectionName}</span>
                        <Badge variant="secondary">
                          {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {questions.filter((q) => q.required).length} requeridas
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {sortedQuestions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          formId={formId}
                          onUpdate={fetchForm}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Form Settings */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Configuración del Formulario</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Permitir Guardar Borrador</dt>
              <dd className="mt-1">
                <Badge variant={form.settings.allowSaveDraft ? 'default' : 'secondary'}>
                  {form.settings.allowSaveDraft ? 'Sí' : 'No'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Mostrar Barra de Progreso</dt>
              <dd className="mt-1">
                <Badge variant={form.settings.showProgressBar ? 'default' : 'secondary'}>
                  {form.settings.showProgressBar ? 'Sí' : 'No'}
                </Badge>
              </dd>
            </div>
            {form.settings.submitMessage && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Mensaje de Envío</dt>
                <dd className="mt-1 text-sm">{form.settings.submitMessage}</dd>
              </div>
            )}
            {form.settings.redirectUrl && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">URL de Redirección</dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={form.settings.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {form.settings.redirectUrl}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Creado Por</dt>
              <dd className="mt-1">{form.createdBy}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Fecha de Creación</dt>
              <dd className="mt-1">
                {new Date(form.createdAt).toLocaleString('es-MX')}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Última Actualización</dt>
              <dd className="mt-1">
                {new Date(form.updatedAt).toLocaleString('es-MX')}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
