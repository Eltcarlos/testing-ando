"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useUploadStore } from "@/lib/upload/store";
import { VALID_VIDEO_TYPES, MAX_FILE_SIZE } from "@/lib/upload/constants";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (videoUrl: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function VideoUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
}: VideoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addedToQueue, setAddedToQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToQueue } = useUploadStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setAddedToQueue(false);

    // Validate file type
    if (!VALID_VIDEO_TYPES.includes(file.type)) {
      setError(
        "Por favor selecciona un archivo de video válido (.mp4, .mov, .avi, .webm, .mkv)"
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`El archivo es demasiado grande. Máximo ${formatFileSize(MAX_FILE_SIZE)}.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleAddToQueue = async () => {
    if (!selectedFile) return;

    setIsAdding(true);
    setError(null);

    try {
      await addToQueue(selectedFile);
      setAddedToQueue(true);
      toast.success("Video agregado a la cola de subida", {
        description: "El video se subirá en segundo plano. Puedes continuar navegando.",
      });

      // Note: onUploadComplete will be called from the global upload system
      // when the upload actually completes, not here
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al agregar el video a la cola";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setAddedToQueue(false);
    setError(null);
    onOpenChange(false);
  };

  const handleAddAnother = () => {
    setSelectedFile(null);
    setAddedToQueue(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Subir Video</DialogTitle>
          <DialogDescription>
            Sube un video para usarlo en los cursos. El video se subirá en segundo plano
            y podrás continuar navegando.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!addedToQueue ? (
            <>
              {/* Info banner about background uploads */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Subida en segundo plano</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Los videos se suben en segundo plano. Puedes navegar o cerrar el
                    navegador y la subida continuará automáticamente.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="video-file">Seleccionar Video</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept={VALID_VIDEO_TYPES.join(",")}
                  onChange={handleFileSelect}
                  disabled={isAdding}
                />
                {selectedFile && !error && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Formatos soportados: MP4, MOV, AVI, WebM, MKV. Tamaño máximo:{" "}
                {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Video agregado a la cola
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedFile?.name}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                El progreso de la subida se muestra en la esquina inferior derecha.
                Puedes cerrar este diálogo y continuar navegando.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!addedToQueue ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isAdding}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddToQueue}
                disabled={!selectedFile || isAdding || !!error}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isAdding ? "Agregando..." : "Agregar a la cola"}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleAddAnother}>
                Subir otro video
              </Button>
              <Button type="button" onClick={handleClose}>
                Cerrar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
