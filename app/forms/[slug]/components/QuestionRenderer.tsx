'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
  };
}

interface QuestionRendererProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  questionNumber: number;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  questionNumber,
}: QuestionRendererProps) {
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(false);

  const renderInput = () => {
    const commonInputClasses = "mt-3 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 h-14 rounded-xl";
    const commonTextareaClasses = "mt-3 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 rounded-xl min-h-[120px] p-4";

    switch (question.type) {
      case 'short_text':
        return (
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tu respuesta..."
            maxLength={question.validation?.maxLength}
            className={commonInputClasses}
          />
        );

      case 'long_text':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe tu respuesta detallada aquí..."
            maxLength={question.validation?.maxLength}
            rows={5}
            className={commonTextareaClasses}
          />
        );

      case 'single_select':
      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => onChange(val)}
          >
            <SelectTrigger className={commonInputClasses}>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value} className="focus:bg-accent focus:text-accent-foreground">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={(val) => onChange(val)}
            className="mt-4 grid grid-cols-1 gap-3"
          >
            {question.options?.map((option) => (
              <div
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer group",
                  value === option.value
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                    : "bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`${question.id}-${option.value}`}
                  className="border-muted-foreground text-primary"
                />
                <Label
                  htmlFor={`${question.id}-${option.value}`}
                  className="flex-1 cursor-pointer text-foreground font-medium text-lg leading-none"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multi_select':
      case 'checkbox':
        // Support both array and comma-separated string
        let selectedValues: string[] = [];
        if (Array.isArray(value)) {
          selectedValues = value;
        } else if (typeof value === 'string' && value.length > 0) {
          selectedValues = value.split(',').map(v => v.trim());
        }

        return (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {question.options?.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    let newValues: string[];
                    if (isChecked) {
                      newValues = selectedValues.filter((v) => v !== option.value);
                    } else {
                      newValues = [...selectedValues, option.value];
                    }
                    onChange(newValues.join(','));
                  }}
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer group",
                    isChecked
                      ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                      : "bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    id={`${question.id}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      let newValues: string[];
                      if (checked) {
                        newValues = [...selectedValues, option.value];
                      } else {
                        newValues = selectedValues.filter((v) => v !== option.value);
                      }
                      onChange(newValues.join(','));
                    }}
                    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`${question.id}-${option.value}`}
                    className="flex-1 cursor-pointer text-foreground font-medium text-lg leading-none"
                  >
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'scale':
        const min = question.validation?.minValue || 1;
        const max = question.validation?.maxValue || 10;
        const scaleValue = typeof value === 'number' ? value : min;

        return (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Mínimo ({min})</span>
              <div className="bg-primary/20 text-primary px-4 py-2 rounded-xl border border-primary/30 font-black text-2xl">
                {scaleValue}
              </div>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Máximo ({max})</span>
            </div>

            <div className="px-2">
              <input
                type="range"
                min={min}
                max={max}
                value={scaleValue}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(
                (num) => (
                  <button
                    key={num}
                    onClick={() => onChange(num)}
                    className={cn(
                      'w-10 h-10 rounded-lg font-bold transition-all duration-300 border flex items-center justify-center',
                      scaleValue === num
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-110'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {num}
                  </button>
                )
              )}
            </div>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              onChange(val);
            }}
            placeholder="0"
            min={question.validation?.minValue}
            max={question.validation?.maxValue}
            className={commonInputClasses}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="correo@ejemplo.com"
            className={commonInputClasses}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="55 1234 5678"
            className={commonInputClasses}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={commonInputClasses}
          />
        );

      case 'file':
        const fileValue = value as
          | string
          | { key: string; size?: number; filename?: string }
          | undefined;

        const handleFileUpload = async (
          e: React.ChangeEvent<HTMLInputElement>
        ) => {
          const file = e.target.files?.[0];
          if (!file) return;

          // Validate file type
          if (question.validation?.allowedFileTypes) {
            if (
              !question.validation.allowedFileTypes.includes(file.type)
            ) {
              toast.error('Tipo de archivo no permitido');
              return;
            }
          }

          // Validate file size
          if (question.validation?.maxFileSize) {
            if (file.size > question.validation.maxFileSize) {
              const maxSizeMB = (
                question.validation.maxFileSize /
                1024 /
                1024
              ).toFixed(2);
              toast.error(
                `El archivo excede el tamaño máximo de ${maxSizeMB}MB`
              );
              return;
            }
          }

          try {
            setUploading(true);

            // Create form data (using the existing /api/upload endpoint)
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload/s3', {
              method: 'POST',
              body: formData,
            });

            if (!res.ok) {
              throw new Error('Failed to upload file');
            }

            const data = await res.json();
            const key = data.key || data.s3Key || data.url || data.publicUrl || null;
            // Store key, size and filename instead of a public URL
            onChange(key ? { key, size: file.size, filename: file.name } : null);
            toast.success('Archivo cargado exitosamente');
          } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Error al cargar el archivo');
          } finally {
            setUploading(false);
          }
        };

        const displayFileName = (() => {
          if (typeof fileValue === 'string') return fileValue.split('/').pop() || fileValue;
          if (fileValue && typeof fileValue === 'object') {
            if (fileValue.filename) return fileValue.filename;
            if (fileValue.key && typeof fileValue.key === 'string') return fileValue.key.split('/').pop() || fileValue.key;
            return 'Archivo';
          }
          return '';
        })();

        const handleViewFile = async () => {
          try {
            setViewing(true);
            if (!fileValue) return;

            if (typeof fileValue === 'string') {
              window.open(fileValue, '_blank');
              return;
            }

            const key = fileValue.key || fileValue.key || null;
            if (!key) {
              toast.error('No se encontró la key del archivo');
              return;
            }

            const res = await fetch(`/api/upload/s3/signed?key=${encodeURIComponent(key)}`);
            if (!res.ok) throw new Error('Failed to get signed url');
            const data = await res.json();
            const url = data.url || data.signedUrl || data.presignedUrl;
            if (!url) throw new Error('Signed URL not returned');
            window.open(url, '_blank');
          } catch (err) {
            console.error('Error fetching signed URL', err);
            toast.error('No se pudo abrir el archivo');
          } finally {
            setViewing(false);
          }
        };

        return (
          <div className="mt-4">
            {fileValue ? (
              <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {displayFileName}
                  </p>
                  <p className="text-xs text-primary/70 uppercase font-black">Archivo Cargado</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleViewFile}
                    disabled={viewing}
                    className="bg-primary/10 hover:bg-primary/20 p-2 rounded-lg text-primary transition-colors"
                    title="Ver archivo"
                  >
                    {viewing ? '...' : 'Ver'}
                  </button>
                  <button
                    onClick={() => onChange(null)}
                    className="bg-destructive/10 hover:bg-destructive/20 p-2 rounded-lg text-destructive transition-colors"
                    title="Eliminar archivo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={cn(
                  'flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 overflow-hidden relative group',
                  uploading
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-muted/5 hover:border-primary/50 hover:bg-muted/10'
                )}
              >
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className={cn(
                    "mb-3 p-3 rounded-2xl transition-all duration-300",
                    uploading ? "bg-primary/20 text-primary animate-bounce" : "bg-muted text-muted-foreground group-hover:scale-110 group-hover:text-foreground"
                  )}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-foreground font-bold mb-1">
                    {uploading ? 'Cargando archivo...' : 'Sube tu archivo'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {uploading ? 'Por favor espera un momento' : 'Arrastra y suelta o haz clic para buscar'}
                  </p>
                  {question.validation?.allowedFileTypes && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {question.validation.allowedFileTypes.slice(0, 3).map((t) => (
                        <span key={t} className="text-[9px] font-black uppercase tracking-tighter bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                          {t.split('/')[1] || t}
                        </span>
                      ))}
                      {question.validation.allowedFileTypes.length > 3 && (
                        <span className="text-[9px] font-black uppercase text-muted-foreground">+{question.validation.allowedFileTypes.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept={question.validation?.allowedFileTypes?.join(',')}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tu respuesta..."
            className={commonInputClasses}
          />
        );
    }
  };

  return (
    <div
      id={`question-${question.id}`}
      className="bg-card p-8 rounded-3xl border border-border/50 hover:border-border transition-all duration-500 shadow-lg group/q"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-primary/10 text-primary w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border border-primary/20 group-hover/q:scale-110 transition-transform duration-500">
          {questionNumber}
        </div>
        <div className="flex-1 pt-1">
          <label className="block text-xl font-bold text-foreground leading-snug tracking-tight">
            {question.label}
            {question.required && (
              <span className="text-destructive ml-1.5 text-sm">*</span>
            )}
          </label>
          {question.description && (
            <p className="text-muted-foreground mt-2 text-base leading-relaxed font-medium">
              {question.description}
            </p>
          )}
        </div>
      </div>

      {/* Question Input */}
      <div className="relative z-10">
        {renderInput()}
      </div>

      {/* character count for text fields */}
      {(question.type === 'short_text' || question.type === 'long_text') &&
        question.validation?.maxLength && (
          <div className="flex justify-end mt-3">
            <p className={cn(
              "text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded border",
              ((value as string) || '').length >= question.validation.maxLength
                ? "text-destructive border-destructive/30 bg-destructive/5"
                : "text-muted-foreground border-border bg-muted"
            )}>
              {((value as string) || '').length} / {question.validation.maxLength} CARACTERES
            </p>
          </div>
        )}
    </div>
  );
}
