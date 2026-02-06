"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BlogPostWithCategory } from "@/types/editorial";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Loader2, Check, X } from "lucide-react";
import Link from "next/link";

export default function BlogReviewPanel() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<BlogPostWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    try {
      // Use the protected admin endpoint that shows ALL posts
      const response = await fetch(
        `/api/admin/content/posts/review?reviewStatus=pending_review&limit=50`
      );
      if (!response.ok) {
        if (response.status === 403) {
          toast.error("No tienes permisos para ver esta sección");
          return;
        }
        throw new Error("Failed to fetch posts");
      }
      
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Error al cargar los blogs pendientes");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (postId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/content/posts/review/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reviewStatus: action === 'approve' ? 'approved' : 'rejected' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      toast.success(action === 'approve' ? 'Blog aprobado' : 'Blog rechazado');
      // Refresh the list
      await fetchPendingPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Error al actualizar el blog');
    }
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

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          Solo los administradores pueden revisar contenido.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          No hay blogs pendientes de revisión.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blogs Pendientes de Revisión</h2>
          <p className="text-muted-foreground mt-1">Revisa y aprueba contenido antes de publicar</p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2 font-semibold">
          {posts.length} {posts.length === 1 ? 'blog' : 'blogs'}
        </Badge>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-500">
            <div className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  {/* Badges y metadata */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={reviewStatusConfig[post.reviewStatus].color}>
                      {reviewStatusConfig[post.reviewStatus].label}
                    </Badge>
                    {post.source === 'human' && (
                      <Badge variant="outline" className="border-blue-500/20 text-blue-600 dark:text-blue-400">
                        Contenido Humano
                      </Badge>
                    )}
                  </div>

                  {/* Título */}
                  <div>
                    <h3 className="text-2xl font-bold mb-2 leading-tight hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium">Por:</span>
                      <span className="font-semibold text-foreground">
                        {post.authorName || post.createdBy}
                      </span>
                      {post.authorPosition && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="italic">{post.authorPosition}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Categoría y tema */}
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {post.category?.label || 'Sin categoría'}
                    </Badge>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-sm text-muted-foreground font-medium">{post.topic}</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <Link href={`/contenido/edit/${post.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      Revisar y Moderar
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleQuickAction(post.id, 'reject')}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleQuickAction(post.id, 'approve')}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
