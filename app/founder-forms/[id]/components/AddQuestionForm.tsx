'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuestionType } from '@prisma/client';
import { toast } from 'sonner';

interface AddQuestionFormProps {
  formId: string;
  sections: string[];
  onSuccess: () => void;
}

export function AddQuestionForm({ formId, sections, onSuccess }: AddQuestionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'short_text' as QuestionType,
    label: '',
    description: '',
    required: false,
    section: sections[0] || 'General',
  });

  const questionTypes: Array<{ value: QuestionType; label: string }> = [
    { value: 'short_text', label: 'Texto corto' },
    { value: 'long_text', label: 'Texto largo' },
    { value: 'single_select', label: 'Selección única' },
    { value: 'multi_select', label: 'Selección múltiple' },
    { value: 'scale', label: 'Escala' },
    { value: 'date', label: 'Fecha' },
    { value: 'file', label: 'Archivo' },
  ];

  const handleReset = () => {
    setFormData({
      type: 'short_text',
      label: '',
      description: '',
      required: false,
      section: sections[0] || 'General',
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.label.trim()) {
      toast.error('La pregunta es requerida');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/founder-forms/${formId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          label: formData.label.trim(),
          description: formData.description.trim() || undefined,
          required: formData.required,
          section: formData.section,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create question');
      }

      toast.success('Pregunta creada exitosamente');
      handleReset();
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Error al crear la pregunta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Pregunta
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 border-2 border-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Nueva Pregunta</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Type */}
          <div>
            <Label htmlFor="question-type">
              Tipo de Pregunta <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: QuestionType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger id="question-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          <div>
            <Label htmlFor="section">
              Sección <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.section}
              onValueChange={(value) => setFormData({ ...formData, section: value })}
            >
              <SelectTrigger id="section">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ Nueva Sección...</SelectItem>
              </SelectContent>
            </Select>
            {formData.section === '__new__' && (
              <Input
                className="mt-2"
                placeholder="Nombre de la nueva sección"
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            )}
          </div>

          {/* Label */}
          <div>
            <Label htmlFor="label">
              Pregunta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="¿Cuál es el nombre de tu empresa?"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.label.length}/500 caracteres
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Agrega contexto o instrucciones adicionales..."
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.description.length}/1000 caracteres
            </p>
          </div>

          {/* Required */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, required: checked as boolean })
              }
            />
            <Label htmlFor="required" className="text-sm font-normal cursor-pointer">
              Esta pregunta es obligatoria
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creando...' : 'Crear Pregunta'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
