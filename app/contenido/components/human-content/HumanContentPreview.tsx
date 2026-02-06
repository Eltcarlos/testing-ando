'use client';

import React, { useState } from 'react';
import { Check, Edit2, Eye, Loader2, User, Building2, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HumanContentPreviewProps {
  title: string;
  content: string; // Markdown content
  category: string;
  topic: string;
  editorialTeamType: 'person' | 'company';
  authorName: string;
  authorPosition: string;
  featuredImage?: File | null;
  onEdit: () => void;
  onPublish: () => Promise<void>;
}

export default function HumanContentPreview({
  title,
  content,
  category,
  topic,
  editorialTeamType,
  authorName,
  authorPosition,
  featuredImage,
  onEdit,
  onPublish,
}: HumanContentPreviewProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    if (featuredImage) {
      const reader = new FileReader();
      reader.readAsDataURL(featuredImage);
      return null;
    }
    return null;
  });

  // Load image preview
  React.useEffect(() => {
    if (featuredImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(featuredImage);
    }
  }, [featuredImage]);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      await onPublish();
    } catch (error) {
      console.error('Error publishing:', error);
      setPublishError('Error al publicar el contenido. Por favor, intenta nuevamente.');
    } finally {
      setIsPublishing(false);
    }
  };

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Vista Previa del Contenido</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 text-foreground bg-background border border-input rounded-md hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Ver Markdown' : 'Ver Vista Previa'}
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 text-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong>Categoría:</strong> {category}
          </span>
          <span>
            <strong>Tema:</strong> {topic}
          </span>
          <span className="flex items-center gap-1">
            {editorialTeamType === 'person' ? (
              <>
                <User className="h-4 w-4" />
                <strong>{authorName}</strong>
                {authorPosition && <span className="text-xs">({authorPosition})</span>}
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                <strong>{authorName}</strong>
              </>
            )}
          </span>
          <span>
            <strong>Palabras:</strong> {wordCount}
          </span>
          <span>
            <strong>Tiempo de lectura:</strong> {readingTime} min
          </span>
        </div>
      </div>

      {/* Featured Image Preview */}
      {imagePreview && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imagen destacada
          </h3>
          <div className="w-full h-64 rounded-lg overflow-hidden border border-input">
            <img 
              src={imagePreview} 
              alt="Featured" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className="bg-card rounded-lg border border-border p-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">{title}</h1>

        {showPreview ? (
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-foreground">{content}</code>
          </pre>
        )}
      </div>

      {/* Error Message */}
      {publishError && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {publishError}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex justify-center">
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Enviar a Revisión
              </>
            )}
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          Al enviar, tu contenido será revisado por un administrador antes de publicarse.
        </p>
      </div>
    </div>
  );
}