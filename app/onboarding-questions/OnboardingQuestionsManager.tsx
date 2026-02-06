"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Download, GripVertical, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { OnboardingQuestionForm } from "./OnboardingQuestionForm";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OnboardingQuestion {
  id: string;
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

interface SortableRowProps {
  question: OnboardingQuestion;
  getTypeLabel: (type: string) => string;
  onToggleActive: (question: OnboardingQuestion) => void;
  onEdit: (question: OnboardingQuestion) => void;
  onDelete: (question: OnboardingQuestion) => void;
}

function SortableRow({ question, getTypeLabel, onToggleActive, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{question.step_number}</TableCell>
      <TableCell className="font-mono text-sm">{question.question_id}</TableCell>
      <TableCell className="max-w-xs truncate">{question.title}</TableCell>
      <TableCell>
        <Badge variant="outline">{getTypeLabel(question.type)}</Badge>
      </TableCell>
      <TableCell>
        {question.required ? (
          <Badge variant="default">Sí</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        )}
      </TableCell>
      <TableCell>
        {question.active ? (
          <Badge variant="default" className="bg-green-600">
            Activa
          </Badge>
        ) : (
          <Badge variant="secondary">Inactiva</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleActive(question)}
            title={question.active ? "Desactivar" : "Activar"}
          >
            {question.active ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(question)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(question)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function OnboardingQuestionsManager() {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<OnboardingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<OnboardingQuestion | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<OnboardingQuestion | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/onboarding-questions");
      if (!response.ok) throw new Error("Error al cargar las preguntas");
      const data = await response.json();
      const sortedQuestions = data.questions.sort((a: OnboardingQuestion, b: OnboardingQuestion) => 
        a.step_number - b.step_number
      );
      setQuestions(sortedQuestions);
      setOriginalQuestions(sortedQuestions);
      setHasChanges(false);
    } catch (error) {
      toast.error("No se pudieron cargar las preguntas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (question: OnboardingQuestion) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDelete = (question: OnboardingQuestion) => {
    setDeletingQuestion(question);
  };

  const confirmDelete = async () => {
    if (!deletingQuestion) return;

    try {
      // Eliminar la pregunta
      const response = await fetch(`/api/admin/onboarding-questions/${deletingQuestion.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar la pregunta");

      // Reordenar las preguntas restantes para llenar el hueco
      const deletedStepNumber = deletingQuestion.step_number;
      const questionsToReorder = questions
        .filter((q) => q.id !== deletingQuestion.id && q.step_number > deletedStepNumber)
        .map((q) => ({
          id: q.question_id,
          step_number: q.step_number - 1,
        }));

      // Si hay preguntas que reordenar, actualizar el backend
      if (questionsToReorder.length > 0) {
        const reorderResponse = await fetch("/api/admin/onboarding-questions/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: questionsToReorder }),
        });

        if (!reorderResponse.ok) {
          console.warn("No se pudieron reordenar las preguntas automáticamente");
        }
      }

      toast.success("Pregunta eliminada y preguntas reordenadas correctamente");
      setDeletingQuestion(null);
      fetchQuestions();
    } catch (error) {
      toast.error("No se pudo eliminar la pregunta");
      setDeletingQuestion(null);
    }
  };

  const handleToggleActive = async (question: OnboardingQuestion) => {
    try {
      const response = await fetch(`/api/admin/onboarding-questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !question.active }),
      });

      if (!response.ok) throw new Error("Error al actualizar el estado");

      toast.success(`Pregunta ${!question.active ? "activada" : "desactivada"} correctamente`);
      fetchQuestions();
    } catch (error) {
      toast.error("No se pudo actualizar el estado de la pregunta");
    }
  };

  const handleSave = () => {
    setIsDialogOpen(false);
    fetchQuestions();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Actualizar step_number basado en la nueva posición
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          step_number: index + 1,
        }));
        
        setHasChanges(true);
        return updatedItems;
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      
      const reorderedQuestions = questions.map((q) => ({
        id: q.question_id,
        step_number: q.step_number,
      }));

      const response = await fetch("/api/admin/onboarding-questions/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: reorderedQuestions }),
      });

      if (!response.ok) throw new Error("Error al guardar el orden");

      toast.success("Orden guardado correctamente");
      setOriginalQuestions(questions);
      setHasChanges(false);
    } catch (error) {
      toast.error("No se pudo guardar el orden");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReorder = () => {
    setQuestions(originalQuestions);
    setHasChanges(false);
    toast.info("Cambios descartados");
  };

  const handleExport = () => {
    try {
      // Preparar datos para exportar (sin el campo id de MongoDB)
      const exportData = questions.map(({ id, ...question }) => ({
        ...question,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Crear el JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Crear enlace de descarga
      const link = document.createElement("a");
      link.href = url;
      link.download = `onboarding-questions-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Preguntas exportadas correctamente");
    } catch (error) {
      toast.error("Error al exportar las preguntas");
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      dropdown: "Selector",
      email: "Email",
      text: "Texto",
      "multi-card": "Tarjetas Múltiples",
      "single-card": "Tarjeta Simple",
      "calendar-age": "Edad",
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Preguntas de Onboarding</h2>
          <p className="text-muted-foreground">
            Gestiona las preguntas del proceso de onboarding inicial
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={questions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Pregunta
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Tienes cambios sin guardar en el orden de las preguntas
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelReorder}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveOrder} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar Orden"}
            </Button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-16">Paso</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Requerida</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No hay preguntas configuradas
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((question) => (
                    <SortableRow
                      key={question.id}
                      question={question}
                      getTypeLabel={getTypeLabel}
                      onToggleActive={handleToggleActive}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Editar Pregunta" : "Nueva Pregunta"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Modifica los campos de la pregunta"
                : "Crea una nueva pregunta para el onboarding inicial"}
            </DialogDescription>
          </DialogHeader>
          <OnboardingQuestionForm
            question={editingQuestion}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            existingSteps={questions
              .filter((q) => q.id !== editingQuestion?.id)
              .map((q) => q.step_number)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la pregunta:
              <br />
              <br />
              <strong>{deletingQuestion?.title}</strong>
              <br />
              <span className="text-xs text-muted-foreground">ID: {deletingQuestion?.question_id}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
