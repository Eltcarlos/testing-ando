'use client';

import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import { Save, FileText, Upload, User, Building2, Image as ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface HumanContentFormProps {
  category: string;
  topic: string;
  initialTitle?: string;
  initialHtmlContent?: string;
  initialMarkdownContent?: string;
  initialEditorialTeamType?: 'person' | 'company';
  initialAuthorName?: string;
  initialAuthorPosition?: string;
  initialFeaturedImage?: File | null;
  onContentReady: (
    title: string, 
    content: string, 
    markdown: string,
    editorialTeamType: 'person' | 'company',
    authorName: string,
    authorPosition: string,
    featuredImage?: File | null
  ) => void;
}

export default function HumanContentForm({
  category,
  topic,
  initialTitle = '',
  initialHtmlContent = '',
  initialMarkdownContent = '',
  initialEditorialTeamType = 'person',
  initialAuthorName = '',
  initialAuthorPosition = '',
  initialFeaturedImage = null,
  onContentReady,
}: HumanContentFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [htmlContent, setHtmlContent] = useState(initialHtmlContent);
  const [markdownContent, setMarkdownContent] = useState(initialMarkdownContent);
  const [editorialTeamType, setEditorialTeamType] = useState<'person' | 'company'>(initialEditorialTeamType);
  const [authorName, setAuthorName] = useState(initialAuthorName);
  const [authorPosition, setAuthorPosition] = useState(initialAuthorPosition);
  const [featuredImage, setFeaturedImage] = useState<File | null>(initialFeaturedImage);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [useRichEditor, setUseRichEditor] = useState(true);
  const [errors, setErrors] = useState<{ 
    title?: string; 
    content?: string;
    image?: string;
    authorName?: string;
    authorPosition?: string;
  }>({});

  // Load image preview from initial image
  useEffect(() => {
    if (initialFeaturedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(initialFeaturedImage);
    }
  }, [initialFeaturedImage]);

  // Auto-save to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('humanContentDraft');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.category === category && parsed.topic === topic) {
        setTitle(parsed.title || '');
        setHtmlContent(parsed.htmlContent || '');
        setMarkdownContent(parsed.markdownContent || '');
        setEditorialTeamType(parsed.editorialTeamType || 'person');
        setAuthorName(parsed.authorName || '');
        setAuthorPosition(parsed.authorPosition || '');
        setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
      }
    }
  }, [category, topic]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (title || htmlContent) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [title, htmlContent, markdownContent, editorialTeamType, authorName, authorPosition, category, topic]);

  const saveDraft = () => {
    setIsSaving(true);
    const draftData = {
      title,
      htmlContent,
      markdownContent,
      editorialTeamType,
      authorName,
      authorPosition,
      category,
      topic,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem('humanContentDraft', JSON.stringify(draftData));
    setLastSaved(new Date());
    setIsSaving(false);
  };

  const handleEditorChange = (html: string, markdown: string) => {
    setHtmlContent(html);
    setMarkdownContent(markdown);
    setErrors({ ...errors, content: undefined });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setErrors({ ...errors, title: undefined });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, image: 'Por favor selecciona un archivo de imagen válido' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: 'La imagen no debe superar los 5MB' });
        return;
      }

      setFeaturedImage(file);
      setErrors({ ...errors, image: undefined });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFeaturedImage(null);
    setImagePreview(null);
    setErrors({ ...errors, image: undefined });
  };

  const validateContent = () => {
    const newErrors: { 
      title?: string; 
      content?: string; 
      image?: string;
      authorName?: string; 
      authorPosition?: string; 
    } = {};

    if (!title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!markdownContent.trim() || markdownContent.trim().length < 50) {
      newErrors.content = 'El contenido debe tener al menos 50 caracteres';
    }

    if (!featuredImage) {
      newErrors.image = 'La imagen destacada es obligatoria';
    }

    if (!authorName.trim()) {
      newErrors.authorName = editorialTeamType === 'person' 
        ? 'El nombre de la persona es requerido' 
        : 'El nombre de la empresa es requerido';
    }

    if (editorialTeamType === 'person' && !authorPosition.trim()) {
      newErrors.authorPosition = 'El puesto/cargo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateContent()) {
      onContentReady(title, htmlContent, markdownContent, editorialTeamType, authorName, authorPosition, featuredImage);
      // Clear draft after successful submission
      localStorage.removeItem('humanContentDraft');
    }
  };

  const wordCount = markdownContent.split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Crear Contenido Manual</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong>Categoría:</strong> {category}
          </span>
          <span>
            <strong>Tema:</strong> {topic}
          </span>
          {lastSaved && (
            <span className="ml-auto text-xs text-muted-foreground">
              {isSaving ? 'Guardando...' : `Guardado: ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
        </div>
      </div>

      {/* Title Input */}
      <div className="bg-card rounded-lg border border-border p-6">
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
          Título del artículo *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Ingresa un título atractivo para tu artículo"
          className={`w-full px-4 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring ${
            errors.title ? 'border-destructive' : 'border-input'
          }`}
          maxLength={200}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">{errors.title}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {title.length}/200 caracteres
        </p>
      </div>

      {/* Editorial Team Type */}
      <div className="bg-card rounded-lg border border-border p-6">
        <label className="block text-sm font-medium text-foreground mb-4">
          Equipo editorial (la persona que lo escribió) *
        </label>
        <RadioGroup value={editorialTeamType} onValueChange={(value: 'person' | 'company') => setEditorialTeamType(value)}>
          <div className="flex items-center space-x-2 mb-3">
            <RadioGroupItem value="person" id="person" />
            <Label htmlFor="person" className="flex items-center gap-2 cursor-pointer text-foreground">
              <User className="h-4 w-4" />
              Es una persona
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="company" id="company" />
            <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer text-foreground">
              <Building2 className="h-4 w-4" />
              Es una empresa
            </Label>
          </div>
        </RadioGroup>

        {/* Author Name Input */}
        <div className="mt-4">
          <label htmlFor="authorName" className="block text-sm font-medium text-foreground mb-2">
            {editorialTeamType === 'person' ? 'Nombre de la persona' : 'Nombre de la empresa'} *
          </label>
          <input
            id="authorName"
            type="text"
            value={authorName}
            onChange={(e) => {
              setAuthorName(e.target.value);
              setErrors({ ...errors, authorName: undefined });
            }}
            placeholder={editorialTeamType === 'person' ? 'Ej. Juan Pérez' : 'Ej. COPARMEX'}
            className={`w-full px-4 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring ${
              errors.authorName ? 'border-destructive' : 'border-input'
            }`}
            maxLength={100}
          />
          {errors.authorName && (
            <p className="mt-1 text-sm text-destructive">{errors.authorName}</p>
          )}
        </div>

        {/* Author Position Input (only for person) */}
        {editorialTeamType === 'person' && (
          <div className="mt-4">
            <label htmlFor="authorPosition" className="block text-sm font-medium text-foreground mb-2">
              Puesto o cargo *
            </label>
            <input
              id="authorPosition"
              type="text"
              value={authorPosition}
              onChange={(e) => {
                setAuthorPosition(e.target.value);
                setErrors({ ...errors, authorPosition: undefined });
              }}
              placeholder="Ej. Director de Marketing"
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring ${
                errors.authorPosition ? 'border-destructive' : 'border-input'
              }`}
              maxLength={100}
            />
            {errors.authorPosition && (
              <p className="mt-1 text-sm text-destructive">{errors.authorPosition}</p>
            )}
          </div>
        )}
      </div>

      {/* Featured Image Upload */}
      <div className="bg-card rounded-lg border border-border p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Imagen destacada *
        </label>
        <p className="text-sm text-muted-foreground mb-4">
          Sube una imagen que represente tu artículo (obligatoria, máx. 5MB)
        </p>
        
        {imagePreview ? (
          <div className="space-y-4">
            <div className="relative w-full h-64 rounded-lg overflow-hidden border border-input">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={removeImage}
              className="px-4 py-2 text-destructive bg-destructive/10 rounded-md hover:bg-destructive/20 transition-colors flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Remover imagen
            </button>
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-ring transition-colors ${
            errors.image ? 'border-destructive' : 'border-input'
          }`}>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label 
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-foreground">
                Haz clic para seleccionar una imagen
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG, GIF hasta 5MB
              </span>
            </label>
          </div>
        )}
        
        {errors.image && (
          <p className="mt-2 text-sm text-destructive">{errors.image}</p>
        )}
      </div>

      {/* Content Editor */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">
            Contenido del artículo *
          </label>
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
        {errors.content && (
          <p className="mb-2 text-sm text-destructive">{errors.content}</p>
        )}
        {useRichEditor ? (
          <RichTextEditor
            value={htmlContent}
            onChange={handleEditorChange}
            placeholder="Escribe el contenido de tu artículo aquí..."
            className={errors.content ? 'border-destructive' : ''}
          />
        ) : (
          <Textarea
            value={markdownContent}
            onChange={(e) => {
              const markdown = e.target.value;
              setMarkdownContent(markdown);
              setHtmlContent(markdown);
              setErrors({ ...errors, content: undefined });
            }}
            placeholder="Escribe tu contenido en Markdown..."
            className="min-h-[500px] font-mono bg-background border-input"
          />
        )}
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>{wordCount} palabras</span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Formato: Markdown
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={saveDraft}
          className="px-6 py-2 text-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Guardar Borrador
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Continuar a Vista Previa
        </button>
      </div>
    </div>
  );
}