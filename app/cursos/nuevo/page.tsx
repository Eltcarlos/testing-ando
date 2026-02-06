"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CourseForm } from "../components/CourseForm";
import { createCourse } from "@/lib/api/courses";
import type { CreateCourseInput } from "@/lib/validations/course";

export default function NuevoCursoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Curso creado exitosamente");
      router.push("/cursos");
    },
    onError: (err) => {
      toast.error(`Error al crear curso: ${err.message}`);
    },
  });

  const handleSubmit = (data: CreateCourseInput) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push("/cursos");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page Header */}
      <div className="shrink-0 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/cursos">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver a cursos</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">
              Crear Nuevo Curso
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Completa los datos del nuevo curso. Puedes guardar como borrador y
              publicar más tarde.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 min-h-0">
        <CourseForm
          initialData={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
