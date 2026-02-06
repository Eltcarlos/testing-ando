'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCw, Check, Loader2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { toast } from 'sonner';
import { ContentCategory, ContentFormat } from '@/types/editorial';

interface Props {
  visible: boolean;
  content: string;
  isLoading: boolean;
  onRegenerate: () => void;
  onReset: () => void;
  metadata: {
    category: ContentCategory | null;
    topic: string;
    format: ContentFormat;
    wasCustomTopic: boolean;
  };
}

export function ContentPreview({ visible, content, isLoading, onRegenerate, onReset, metadata }: Props) {
  const { data: session } = useSession();
  const [isPublishing, setIsPublishing] = useState(false);

  if (!visible) return null;

  const handlePublish = async () => {
    if (!content || !metadata.category) return;

    setIsPublishing(true);
    try {
      const adminEmail = session?.user?.email;
      const res = await fetch('/api/admin/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          content,
          categorySlug: metadata.category.slug,
          format: metadata.format,
          topic: metadata.topic,
          wasCustomTopic: metadata.wasCustomTopic,
        }),
      });

      if (res.ok) {
        const { post } = await res.json();
        toast.success('Contenido publicado exitosamente', {
          description: `"${post.title}" ha sido publicado en el blog.`,
        });
        // Reset después de 2 segundos
        setTimeout(() => {
          onReset();
        }, 2000);
      } else {
        toast.error('Error al publicar', {
          description: 'No se pudo publicar el contenido. Intenta de nuevo.',
        });
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Error al publicar', {
        description: 'Ocurrió un error inesperado.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">4. Preview</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vista Previa</CardTitle>
          {metadata.category && (
            <p className="text-sm text-muted-foreground">
              {metadata.category.label} • {metadata.format}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && !content && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Generando contenido...</span>
            </div>
          )}

          {content && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{content}</div>
              {isLoading && (
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </div>
              )}
            </div>
          )}

          {content && !isLoading && (
            <div className="flex gap-2 mt-6 pt-6 border-t">
              <Button
                onClick={onRegenerate}
                variant="outline"
                disabled={isPublishing}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publicar en Blog
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
