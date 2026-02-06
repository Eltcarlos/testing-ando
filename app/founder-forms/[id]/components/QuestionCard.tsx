'use client';

import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { QuestionType } from '@prisma/client';
import { toast } from 'sonner';

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

interface QuestionCardProps {
  question: Question;
  formId: string;
  onUpdate: () => void;
}

export function QuestionCard({ question, formId, onUpdate }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    label: question.label,
    description: question.description || '',
    required: question.required,
  });

  const getQuestionTypeLabel = (type: QuestionType) => {
    const labels: Record<QuestionType, string> = {
      short_text: 'Texto corto',
      long_text: 'Texto largo',
      number: 'Número',
      email: 'Email',
      phone: 'Teléfono',
      single_select: 'Selección única',
      multi_select: 'Selección múltiple',
      radio: 'Opción única',
      checkbox: 'Casilla de verificación',
      scale: 'Escala',
      date: 'Fecha',
      file: 'Archivo',
      dropdown: 'Menú desplegable',
      text: 'Texto',
      multi_card: 'Tarjetas múltiples',
      single_card: 'Tarjeta única',
      calendar_age: 'Edad',
    };
    return labels[type];
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      label: question.label,
      description: question.description || '',
      required: question.required,
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate label is not empty
      if (!editData.label.trim()) {
        toast.error('La etiqueta es requerida');
        return;
      }

      const response = await fetch(
        `/api/admin/founder-forms/${formId}/questions/${question.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: question.id,
            label: editData.label.trim(),
            description: editData.description.trim() || undefined,
            required: editData.required,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update question');
      }

      toast.success('Pregunta actualizada exitosamente');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Error al actualizar la pregunta');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Question metadata (read-only in edit mode) */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-muted-foreground">
                #{question.order}
              </span>
              <Badge variant="outline" className="text-xs">
                {getQuestionTypeLabel(question.type)}
              </Badge>
            </div>

            {/* Editable fields */}
            <div>
              <Label htmlFor={`label-${question.id}`}>
                Pregunta <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`label-${question.id}`}
                value={editData.label}
                onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                placeholder="Escribe la pregunta..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editData.label.length}/500 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor={`description-${question.id}`}>
                Descripción (opcional)
              </Label>
              <Textarea
                id={`description-${question.id}`}
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                placeholder="Agrega contexto o instrucciones adicionales..."
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editData.description.length}/1000 caracteres
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`required-${question.id}`}
                checked={editData.required}
                onCheckedChange={(checked) =>
                  setEditData({ ...editData, required: checked as boolean })
                }
              />
              <Label
                htmlFor={`required-${question.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                Esta pregunta es obligatoria
              </Label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display mode
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-muted-foreground">
                #{question.order}
              </span>
              <Badge variant="outline" className="text-xs">
                {getQuestionTypeLabel(question.type)}
              </Badge>
              {question.required && (
                <Badge variant="destructive" className="text-xs">
                  Requerida
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-base mb-1">{question.label}</h4>
            {question.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {question.description}
              </p>
            )}

            {/* Question Options */}
            {question.options && question.options.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Opciones:
                </p>
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Rules */}
            {question.validation && (
              <div className="mt-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Validaciones:</p>
                <ul className="space-y-1">
                  {question.validation.minLength && (
                    <li>• Mínimo {question.validation.minLength} caracteres</li>
                  )}
                  {question.validation.maxLength && (
                    <li>• Máximo {question.validation.maxLength} caracteres</li>
                  )}
                  {question.validation.minValue !== undefined && (
                    <li>• Valor mínimo: {question.validation.minValue}</li>
                  )}
                  {question.validation.maxValue !== undefined && (
                    <li>• Valor máximo: {question.validation.maxValue}</li>
                  )}
                  {question.validation.allowedFileTypes && (
                    <li>
                      • Tipos de archivo permitidos:{' '}
                      {question.validation.allowedFileTypes.join(', ')}
                    </li>
                  )}
                  {question.validation.maxFileSize && (
                    <li>
                      • Tamaño máximo: {formatFileSize(question.validation.maxFileSize)}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Edit button */}
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
