"use client";

import { BlogPostWithCategory } from "@/types/editorial";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { getFormatLabel } from "@/lib/content/formats";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

interface ContentCardProps {
  post: BlogPostWithCategory;
  onUpdate: () => void;
}

export default function ContentCard({ post, onUpdate }: ContentCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Type assertion for status
  const status = (post.status as 'draft' | 'published' | 'archived' | 'review') || 'draft';

  // Extract preview text from markdown (remove # and get first 150 chars)
  const getPreview = (content: string) => {
    const text = content
      .replace(/^#.*$/gm, "")
      .replace(/[*_`#]/g, "")
      .trim();
    return text.substring(0, 150) + (text.length > 150 ? "..." : "");
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/content/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete post");

      toast.success("Contenido archivado exitosamente");
      setShowDeleteDialog(false);
      onUpdate();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Error al eliminar el contenido");
    } finally {
      setIsDeleting(false);
    }
  };

  const statusConfig = {
    draft: { label: "Borrador", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    review: { label: "En Revisión", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    published: { label: "Publicado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    archived: { label: "Archivado", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  };

  const reviewStatusConfig = {
    pending_review: { 
      label: "Pendiente", 
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
    },
    approved: { 
      label: "Aprobado", 
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
    },
    rejected: { 
      label: "Rechazado", 
      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" 
    },
    published: { 
      label: "Publicado", 
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
    },
  };


  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-border h-full flex flex-col">
        <div className="p-6 flex flex-col h-full">
          {/* Header with badges */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Estado de Publicación</p>
                <Badge className={statusConfig[status].color}>
                  {statusConfig[status].label}
                </Badge>
              </div>
              {post.reviewStatus && reviewStatusConfig[post.reviewStatus as keyof typeof reviewStatusConfig] && (
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Estado de Administración</p>
                  <Badge className={reviewStatusConfig[post.reviewStatus as keyof typeof reviewStatusConfig].color}>
                    {reviewStatusConfig[post.reviewStatus as keyof typeof reviewStatusConfig].label}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {post.format && (
                <Badge variant="outline" className="border-muted-foreground/20">
                  {getFormatLabel(post.format)}
                </Badge>
              )}
              {post.source === 'human' && (
                <Badge variant="outline" className="border-blue-500/20 text-blue-600 dark:text-blue-400">
                  Contenido Humano
                </Badge>
              )}
            </div>
          </div>

          {/* Title - fixed height */}
          <h3 className="text-xl font-bold mb-3 line-clamp-2 text-foreground min-h-[3.5rem]">
            {post.title}
          </h3>

          {/* Category and Topic */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {post.category.label}
            </Badge>
            <span className="text-muted-foreground text-sm">•</span>
            <span className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">{post.topic}</span>
          </div>

          {/* Author info for human content - fixed height */}
          <div className="min-h-[1.75rem] mb-3">
            {post.source === 'human' && post.authorName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Por:</span>
                <span className="truncate">{post.authorName}</span>
                {post.authorPosition && (
                  <>
                    <span>•</span>
                    <span className="italic truncate">{post.authorPosition}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Preview - fixed height with exactly 3 lines */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed h-[4.5rem] overflow-hidden">
            {getPreview(post.content)}
          </p>

          {/* Spacer to push footer to bottom */}
          <div className="flex-1"></div>

          {/* Metadata footer */}
          <div className="flex items-center justify-between mb-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {post.publishedAt
                ? `Publicado: ${formatDate(post.publishedAt)}`
                : `Creado: ${formatDate(post.generatedAt)}`}
            </p>
            {post.featuredImageKey && (
              <Badge variant="outline" className="text-xs">
                Con imagen
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1"
            >
              <Link href={`/contenido/edit/${post.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contenido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción archivará el contenido. Podrás recuperarlo más tarde si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
