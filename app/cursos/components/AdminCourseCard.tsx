"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Eye, CheckCircle, Calendar } from "lucide-react";
import type { Course } from "@prisma/client";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Extended Course type with display labels
interface CourseWithLabels extends Course {
  categoryLabel: string;
  levelLabel: string;
  statusLabel: string;
}

interface AdminCourseCardProps {
  course: CourseWithLabels;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminCourseCard({
  course,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AdminCourseCardProps) {
  // Badge color based on category
  const categoryColors: Record<string, string> = {
    Finanzas: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    "Marketing Digital":
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    Operaciones:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    Legal: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    "Capital Humano":
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
    Ventas: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    Tecnología: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  };

  // Badge color based on level
  const levelColors: Record<string, string> = {
    Básico: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    Intermedio:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    Avanzado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  // Badge color based on status
  const statusColors: Record<string, string> = {
    Publicado:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    Borrador: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    Archivado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  // Access embedded instructor object
  const instructor = course.instructor as {
    name: string;
    bio: string;
    avatar?: string;
  };

  // Access embedded metrics object (can be null)
  const metrics = course.metrics as {
    views: number;
    enrollments: number;
    completions: number;
    completionRate: number;
    averageRating: number;
    totalRatings: number;
    averageTimeToComplete?: string;
  } | null;

  const displayDate = course.publishedAt || course.updatedAt;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg",
        isSelected && "ring-2 ring-primary"
      )}
    >
      {/* Checkbox for selection */}
      <div className="absolute left-3 top-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(course.id, checked as boolean)}
          className="bg-white dark:bg-gray-800 shadow-md"
        />
      </div>

      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/20">
            <span className="text-4xl"></span>
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute right-3 top-3">
          <Badge className={statusColors[course.statusLabel] || "bg-gray-100"}>
            {course.statusLabel}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Category and Level badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            className={categoryColors[course.categoryLabel] || "bg-gray-100"}
          >
            {course.categoryLabel}
          </Badge>
          <Badge className={levelColors[course.levelLabel] || "bg-gray-100"}>
            {course.levelLabel}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
          {course.title}
        </h3>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            <span className="font-medium">Instructor:</span>{" "}
            {instructor?.name || "N/A"}
          </p>
          <p className="flex items-center gap-1">
            <span className="font-medium">Entidad:</span> {course.entity}
          </p>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{metrics.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>{metrics.completions.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {course.publishedAt
              ? `Publicado: ${new Date(course.publishedAt).toLocaleDateString(
                  "es-MX",
                  { year: "numeric", month: "short", day: "numeric" }
                )}`
              : `Actualizado: ${new Date(displayDate).toLocaleDateString(
                  "es-MX",
                  { year: "numeric", month: "short", day: "numeric" }
                )}`}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
