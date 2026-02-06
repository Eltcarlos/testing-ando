"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Archive, Trash2, Upload, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/admin/EmptyState";
import { BookOpen } from "lucide-react";
import { AdminCourseCard } from "./components/AdminCourseCard";
import { CourseFiltersComponent } from "./components/CourseFilters";
import { DeleteCourseDialog } from "./components/DeleteCourseDialog";
import { VideoUploadDialog } from "./components/VideoUploadDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import {
  fetchCourses,
  deleteCourse,
  bulkActionCourses,
} from "@/lib/api/courses";
import {
  categoryFromLabel,
  levelFromLabel,
  statusFromLabel,
  categoryLabels,
  levelLabels,
  statusLabels,
} from "@/lib/enum-mappings";
import type { Course } from "@prisma/client";
import type { CourseFilters } from "@/types/admin";

// Helper to convert UI filters (Spanish labels) to API filters (enum values)
function convertFiltersToApi(filters: CourseFilters) {
  return {
    search: filters.search || undefined,
    category:
      filters.category !== "all"
        ? categoryFromLabel[filters.category]
        : undefined,
    level: filters.level !== "all" ? levelFromLabel[filters.level] : undefined,
    status:
      filters.status !== "all" ? statusFromLabel[filters.status] : undefined,
    entity: filters.entity !== "all" ? filters.entity : undefined,
  };
}

// Helper to convert Course from API to display format
function getCourseDisplayData(course: Course) {
  return {
    ...course,
    categoryLabel: categoryLabels[course.category],
    levelLabel: levelLabels[course.level],
    statusLabel: statusLabels[course.status],
  };
}

export default function CursosAdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<CourseFilters>({
    search: "",
    category: "all",
    level: "all",
    status: "all",
    entity: "all",
  });
  const [debouncedSearch] = useDebounce(filters.search, 500);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set()
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [videoUploadOpen, setVideoUploadOpen] = useState(false);

  // Build API filters with debounced search
  const apiFilters = convertFiltersToApi({
    ...filters,
    search: debouncedSearch,
  });

  // Fetch courses with TanStack Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["courses", apiFilters],
    queryFn: () => fetchCourses(apiFilters),
  });

  const courses = data?.courses ?? [];
  const counts = data?.counts ?? {
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Curso eliminado exitosamente");
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: (err) => {
      toast.error(`Error al eliminar curso: ${err.message}`);
    },
  });

  // Bulk action mutation
  const bulkMutation = useMutation({
    mutationFn: bulkActionCourses,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(`${result.affected} curso(s) actualizados`);
      setSelectedCourseIds(new Set());
    },
    onError: (err) => {
      toast.error(`Error en operación masiva: ${err.message}`);
    },
  });

  const handleSelectCourse = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedCourseIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCourseIds(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCourseIds(new Set(courses.map((c) => c.id)));
    } else {
      setSelectedCourseIds(new Set());
    }
  };

  const handleCreateCourse = () => {
    router.push("/cursos/nuevo");
  };

  const handleEditCourse = (course: Course) => {
    router.push(`/cursos/${course.id}/editar`);
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
    }
  };

  const handleBulkArchive = () => {
    bulkMutation.mutate({
      action: "archive",
      ids: Array.from(selectedCourseIds),
    });
  };

  const handleBulkDelete = () => {
    if (
      confirm(`¿Estás seguro de eliminar ${selectedCourseIds.size} cursos?`)
    ) {
      bulkMutation.mutate({
        action: "delete",
        ids: Array.from(selectedCourseIds),
      });
    }
  };

  const hasSelection = selectedCourseIds.size > 0;
  const isMutating = deleteMutation.isPending || bulkMutation.isPending;

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive">Error: {error?.message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["courses"] })
          }
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Cursos</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {counts.published} cursos publicados · {counts.drafts} borradores
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["courses"] })
            }
            disabled={isLoading}
            className="sm:size-auto"
          >
            <RefreshCw
              className={`h-4 w-4 sm:mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVideoUploadOpen(true)}
          >
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Subir Videos</span>
          </Button>
          <Button size="sm" asChild>
            <Link href="/cursos/nuevo">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo Curso</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CourseFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Bulk Actions Toolbar */}
      {hasSelection && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-primary bg-primary/5">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedCourseIds.size === courses.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">
              {selectedCourseIds.size} curso
              {selectedCourseIds.size !== 1 && "s"} seleccionado
              {selectedCourseIds.size !== 1 && "s"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkArchive}
              disabled={isMutating}
            >
              <Archive className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Archivar</span>
              <span className="sm:hidden">Archivar</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isMutating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Eliminar</span>
              <span className="sm:hidden">Eliminar</span>
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-16">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Cargando cursos...</p>
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No hay cursos que mostrar"
          description="Crea tu primer curso para que las empresas comiencen a aprender"
          actionLabel="+ Crear Curso"
          onAction={handleCreateCourse}
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <AdminCourseCard
              key={course.id}
              course={getCourseDisplayData(course)}
              isSelected={selectedCourseIds.has(course.id)}
              onSelect={handleSelectCourse}
              onEdit={() => handleEditCourse(course)}
              onDelete={() => handleDeleteCourse(course)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteCourseDialog
        course={courseToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Video Upload Dialog */}
      <VideoUploadDialog
        open={videoUploadOpen}
        onOpenChange={setVideoUploadOpen}
      />
    </div>
  );
}
