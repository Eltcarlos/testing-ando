"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BlogPostWithCategory, Category, ContentFormat, BlogPostStatus } from "@/types/editorial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Eye, Check, X } from "lucide-react";
import Link from "next/link";
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useSession } from "next-auth/react";
import { ALL_FORMATS } from "@/lib/content/formats";
import RichTextEditor from "../../components/human-content/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { marked } from 'marked';

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<BlogPostWithCategory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [useRichEditor, setUseRichEditor] = useState(false);
  const [reviewAction, setReviewAction] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: session, status: sessionStatus } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'admin';

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<ContentFormat>("listicle");
  const [status, setStatus] = useState<BlogPostStatus>("draft");

  // Get available topics from selected category
  const availableTopics = categories.find(cat => cat.id === categoryId)?.topics || [];

  useEffect(() => {
    if (sessionStatus === "loading") return;

    const fetchData = async () => {
      try {
        const adminEmail = session?.user?.email;
        if (!adminEmail) {
          throw new Error("Admin email not found");
        }

        // Fetch post
        const postResponse = await fetch(`/api/admin/content/posts/${postId}`);
        if (!postResponse.ok) throw new Error("Failed to fetch post");
        const postData = await postResponse.json();
        setPost(postData);

        // Set form values
        setTitle(postData.title);
        setContent(postData.content);
        setCategoryId(postData.categoryId);
        setTopic(postData.topic);
        setFormat(postData.format);
        setStatus(postData.status);

        // Fetch categories - usar el email del creador del post, no del admin actual
        const creatorEmail = postData.createdBy;
        const categoriesResponse = await fetch(
          `/api/admin/content/categories?adminEmail=${encodeURIComponent(creatorEmail)}`
        );
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar el contenido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, session, sessionStatus]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("El título y el contenido son requeridos");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          topic,
          status,
        }),
      });

      if (!response.ok) throw new Error("Failed to update post");

      toast.success("Contenido actualizado exitosamente");
      router.push("/contenido");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Error al actualizar el contenido");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setReviewAction(true);
    try {
      const response = await fetch(`/api/admin/content/posts/${postId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) throw new Error("Failed to approve post");

      toast.success("Contenido aprobado exitosamente");
      // Actualizar el post local
      if (post) {
        setPost({ ...post, reviewStatus: "approved" } as any);
      }
      router.push("/contenido?tab=review");
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Error al aprobar el contenido");
    } finally {
      setReviewAction(false);
    }
  };

  const handleRejectConfirm = async () => {
    setReviewAction(true);
    try {
      const response = await fetch(`/api/admin/content/posts/${postId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "reject",
          reason: rejectionReason || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject post");

      toast.success("Contenido rechazado");
      setShowRejectDialog(false);
      setRejectionReason("");
      // Actualizar el post local
      if (post) {
        setPost({ ...post, reviewStatus: "rejected" } as any);
      }
      router.push("/contenido?tab=review");
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Error al rechazar el contenido");
    } finally {
      setReviewAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground mb-4">Contenido no encontrado</p>
        <Button asChild>
          <Link href="/contenido">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/contenido">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Editar Contenido</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Editar" : "Vista Previa"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-border">
              {showPreview ? (
                <div className="prose dark:prose-invert max-w-none overflow-hidden">
                  <h1 className="text-3xl font-bold mb-4">{title}</h1>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      // Ensure images are responsive
                      img: ({node, ...props}) => (
                        <img {...props} className="max-w-full h-auto rounded-lg" />
                      ),
                      // Handle code blocks
                      code: ({node, className, children, ...props}) => {
                        const isInline = !className;
                        return isInline ? (
                          <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        ) : (
                          <code {...props} className="block bg-muted p-4 rounded-lg overflow-x-auto font-mono text-sm">
                            {children}
                          </code>
                        );
                      },
                      // Break long text
                      p: ({node, ...props}) => (
                        <p {...props} className="break-words mb-4" />
                      ),
                      // Handle headings
                      h1: ({node, ...props}) => (
                        <h1 {...props} className="text-4xl font-bold mt-8 mb-4 break-words" />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 {...props} className="text-3xl font-bold mt-6 mb-3 break-words" />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 {...props} className="text-2xl font-bold mt-4 mb-2 break-words" />
                      ),
                      // Handle lists
                      ul: ({node, ...props}) => (
                        <ul {...props} className="list-disc pl-6 space-y-2 mb-4" />
                      ),
                      ol: ({node, ...props}) => (
                        <ol {...props} className="list-decimal pl-6 space-y-2 mb-4" />
                      ),
                      // Handle links
                      a: ({node, ...props}) => (
                        <a {...props} className="text-blue-950 hover:underline break-words" />
                      ),
                      // Handle blockquotes
                      blockquote: ({node, ...props}) => (
                        <blockquote {...props} className="border-l-4 border-primary pl-4 italic my-4" />
                      ),
                      // Handle tables
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-4">
                          <table {...props} className="min-w-full border-collapse border border-border" />
                        </div>
                      ),
                      th: ({node, ...props}) => (
                        <th {...props} className="border border-border px-4 py-2 bg-muted font-semibold" />
                      ),
                      td: ({node, ...props}) => (
                        <td {...props} className="border border-border px-4 py-2" />
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-foreground">Título</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título del contenido"
                      className="mt-2 bg-background border-input"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content" className="text-foreground">
                        Contenido (Markdown)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="editor-mode" className="text-sm text-muted-foreground cursor-pointer">
                          {useRichEditor ? "Editor Visual" : "Markdown"}
                        </Label>
                        <Switch
                          id="editor-mode"
                          checked={useRichEditor}
                          onCheckedChange={setUseRichEditor}
                        />
                      </div>
                    </div>
                    {useRichEditor ? (
                      <RichTextEditor
                        value={marked(content) as string}
                        onChange={(html, markdown) => setContent(markdown)}
                      />
                    ) : (
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Escribe tu contenido en Markdown..."
                        className="mt-2 min-h-[500px] font-mono bg-background border-input"
                      />
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-border">
              <h3 className="font-semibold mb-4 text-foreground">Metadatos</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="category" className="text-foreground">Categoría</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="category" className="mt-2 bg-background border-input">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="topic" className="text-foreground">Tema</Label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger id="topic" className="mt-2 bg-background border-input">
                      <SelectValue placeholder="Selecciona un tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTopics.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-foreground">Estado</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as BlogPostStatus)}>
                    <SelectTrigger id="status" className="mt-2 bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="review">En Revisión</SelectItem>
                      {post?.reviewStatus === "approved" && (
                        <SelectItem value="published">Publicado</SelectItem>
                      )}
                      <SelectItem value="archived">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Admin Review Card - Solo para admins */}
            {isAdmin && (
              <Card className="p-6 border-border bg-muted/20">
                <h3 className="font-semibold mb-3 text-foreground">Revisión de Contenido</h3>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-4">
                    <p className="mb-1">Este contenido está pendiente de revisión.</p>
                    <p className="font-medium text-foreground">Estado: Pendiente de Aprobación</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={reviewAction}
                      variant="secondary"
                      className="w-full"
                      size="sm"
                    >
                      {reviewAction ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => setShowRejectDialog(true)}
                      disabled={reviewAction}
                      variant="destructive"
                      className="w-full"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Badge de estado de revisión para no-admins */}
            {!isAdmin && (
              <Card className="p-6 border-border">
                <h3 className="font-semibold mb-2 text-foreground">Estado de Revisión</h3>
                <div className="space-y-2 text-sm">
                  {(post.reviewStatus === 'pending_review' || !post.reviewStatus) && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/20">
                      <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                      <p className="text-yellow-700 dark:text-yellow-400 font-medium">Pendiente de aprobación</p>
                    </div>
                  )}
                  {post.reviewStatus === 'approved' && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-100 dark:bg-emerald-900/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium">Aprobado - Listo para publicar</p>
                    </div>
                  )}
                  {post.reviewStatus === 'rejected' && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-rose-100 dark:bg-rose-900/20">
                      <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                      <p className="text-rose-700 dark:text-rose-400 font-medium">Rechazado - Requiere cambios</p>
                    </div>
                  )}
                  {post.reviewStatus === 'published' && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-blue-100 dark:bg-blue-900/20">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <p className="text-blue-700 dark:text-blue-400 font-medium">Publicado</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6 border-border">
              <h3 className="font-semibold mb-2 text-foreground">Información</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Creado:</span>{" "}
                  {new Date(post.generatedAt).toLocaleDateString("es-MX")}
                </p>
                {post.publishedAt && (
                  <p>
                    <span className="font-medium text-foreground">Publicado:</span>{" "}
                    {new Date(post.publishedAt).toLocaleDateString("es-MX")}
                  </p>
                )}
                <p>
                  <span className="font-medium text-foreground">Autor:</span> {post.createdBy}
                </p>
                {post.source === 'human' && (
                  <>
                    <p>
                      <span className="font-medium text-foreground">Fuente:</span> Contenido Humano
                    </p>
                    {post.authorName && (
                      <p>
                        <span className="font-medium text-foreground">Escrito por:</span> {post.authorName}
                        {post.authorPosition && ` (${post.authorPosition})`}
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar este contenido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el contenido como rechazado. Puedes proporcionar una razón opcional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Razón del rechazo (opcional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
