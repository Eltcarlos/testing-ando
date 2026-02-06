"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CourseForm } from "../../components/CourseForm";
import { fetchCourse, updateCourse } from "@/lib/api/courses";
import type { UpdateCourseInput } from "@/lib/validations/course";

export default function EditarCursoPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const courseId = params.id as string;

  // Fetch course data
  const {
    data: course,
    isLoading: isLoadingCourse,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse(courseId),
    enabled: !!courseId,
    staleTime: 0, // Always fetch fresh data
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCourseInput) => updateCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Curso actualizado exitosamente");
      router.push("/cursos");
    },
    onError: (err) => {
      toast.error(`Error al actualizar curso: ${err.message}`);
    },
  });

  const handleSubmit = (data: UpdateCourseInput) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push("/cursos");
  };

  // Loading state
  if (isLoadingCourse) {
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
                Editar Curso
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Cargando información del curso...
              </p>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Cargando curso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
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
                Editar Curso
              </h1>
              <p className="text-destructive text-sm sm:text-base">
                Error al cargar el curso
              </p>
            </div>
          </div>
        </div>

        {/* Error content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-lg font-semibold">
              No se pudo cargar el curso
            </h2>
            <p className="mt-2 text-muted-foreground">
              {error?.message || "Ocurrió un error inesperado"}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button asChild>
                <Link href="/cursos">Volver a cursos</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course not found (shouldn't happen with proper error handling, but just in case)
  if (!course) {
    return (
      <div className="flex flex-col h-full min-h-0">
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
                Curso no encontrado
              </h1>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">
              El curso que buscas no existe o fue eliminado.
            </p>
            <Button asChild className="mt-4">
              <Link href="/cursos">Volver a cursos</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              Editar Curso
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base truncate">
              {course.title}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 min-h-0">
        <CourseForm
          initialData={course}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
