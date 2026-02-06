"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface OnboardingQuestion {
  id?: string;
  question_id: string;
  step_number: number;
  title: string;
  subtitle?: string;
  type: string;
  required: boolean;
  active: boolean;
  multiline: boolean;
  max_length?: number;
  placeholder?: string;
  options?: any;
}

interface OnboardingQuestionFormProps {
  question: OnboardingQuestion | null;
  onSave: () => void;
  onCancel: () => void;
  existingSteps?: number[]; // Pasos ya usados
}

const QUESTION_TYPES = [
  { value: "dropdown", label: "Selector (Dropdown)" },
  { value: "email", label: "Email" },
  { value: "text", label: "Texto" },
  { value: "multi-card", label: "Tarjetas Múltiples" },
  { value: "single-card", label: "Tarjeta Simple" },
  { value: "calendar-age", label: "Edad (Calendario)" },
];

export function OnboardingQuestionForm({
  question,
  onSave,
  onCancel,
  existingSteps = [],
}: OnboardingQuestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>(
    question?.options && Array.isArray(question.options)
      ? question.options
      : []
  );
  const [formData, setFormData] = useState<Partial<OnboardingQuestion>>({
    question_id: question?.question_id || "",
    step_number: question?.step_number || 1,
    title: question?.title || "",
    subtitle: question?.subtitle || "",
    type: question?.type || "text",
    required: question?.required ?? true,
    active: question?.active ?? true,
    multiline: question?.multiline ?? false,
    max_length: question?.max_length,
    placeholder: question?.placeholder || "",
  });

  const requiresOptions = ["dropdown", "multi-card", "single-card"].includes(
    formData.type || ""
  );

  // Detectar si el step_number actual está duplicado
  const isDuplicateStep = 
    !question && // Solo al crear
    existingSteps.includes(formData.step_number || 0);

  // Sugerir el siguiente paso disponible
  const suggestedNextStep = Math.max(0, ...existingSteps) + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        options: requiresOptions ? options : null,
      };

      const url = question
        ? `/api/admin/onboarding-questions/${question.id}`
        : "/api/admin/onboarding-questions";

      const response = await fetch(url, {
        method: question ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar la pregunta");
      }

      toast.success(`Pregunta ${question ? "actualizada" : "creada"} correctamente`);
      onSave();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la pregunta");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { id: "", label: "" }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: "id" | "label", value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="question_id">
            ID de Pregunta <span className="text-destructive">*</span>
          </Label>
          <Input
            id="question_id"
            value={formData.question_id}
            onChange={(e) =>
              setFormData({ ...formData, question_id: e.target.value })
            }
            placeholder="e.g., company-name"
            disabled={!!question}
            required
          />
          {question && (
            <p className="text-sm text-muted-foreground">
              El ID no puede modificarse en preguntas existentes
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="step_number">
            Número de Paso <span className="text-destructive">*</span>
          </Label>
          <Input
            id="step_number"
            type="number"
            min="1"
            value={formData.step_number}
            onChange={(e) =>
              setFormData({ ...formData, step_number: parseInt(e.target.value) })
            }
            className={isDuplicateStep ? "border-destructive" : ""}
            required
          />
          {isDuplicateStep && (
            <p className="text-sm text-destructive">
              ⚠️ Ya existe una pregunta en este paso. Siguiente disponible: {suggestedNextStep}
            </p>
          )}
          {!question && !isDuplicateStep && existingSteps.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Siguiente paso sugerido: {suggestedNextStep}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="¿Cómo se llama tu empresa?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
        <Input
          id="subtitle"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          placeholder="Texto adicional de ayuda"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">
          Tipo de Pregunta <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {requiresOptions && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Opciones</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-1 h-3 w-3" />
              Agregar Opción
            </Button>
          </div>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="ID"
                  value={option.id}
                  onChange={(e) => updateOption(index, "id", e.target.value)}
                  className="w-1/3"
                />
                <Input
                  placeholder="Etiqueta"
                  value={option.label}
                  onChange={(e) => updateOption(index, "label", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder (opcional)</Label>
          <Input
            id="placeholder"
            value={formData.placeholder}
            onChange={(e) =>
              setFormData({ ...formData, placeholder: e.target.value })
            }
            placeholder="Texto de ayuda en el campo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_length">Longitud Máxima (opcional)</Label>
          <Input
            id="max_length"
            type="number"
            min="1"
            value={formData.max_length || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                max_length: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Requerida</Label>
          <p className="text-sm text-muted-foreground">
            El usuario debe responder esta pregunta
          </p>
        </div>
        <Switch
          checked={formData.required}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, required: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Multilínea</Label>
          <p className="text-sm text-muted-foreground">
            Permitir texto en múltiples líneas
          </p>
        </div>
        <Switch
          checked={formData.multiline}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, multiline: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Activa</Label>
          <p className="text-sm text-muted-foreground">
            Mostrar esta pregunta en el onboarding
          </p>
        </div>
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, active: checked })
          }
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : question ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
