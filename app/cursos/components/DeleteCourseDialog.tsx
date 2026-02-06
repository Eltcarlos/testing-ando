"use client";

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
import { Loader2 } from "lucide-react";
import type { Course } from "@prisma/client";

interface DeleteCourseDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteCourseDialog({
  course,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteCourseDialogProps) {
  if (!course) return null;

  // Access embedded metrics object
  const metrics = course.metrics as {
    views: number;
    enrollments: number;
    completions: number;
  } | null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar el curso{" "}
            <span className="font-semibold">&quot;{course.title}&quot;</span>.
            Esta acción no se puede deshacer.
            {metrics && metrics.enrollments > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                Este curso tiene {metrics.enrollments} usuarios inscritos.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Eliminar curso
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
