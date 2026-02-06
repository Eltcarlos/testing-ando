"use client";

import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Pause,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadMetadata } from "@/lib/upload/types";
import { useUploadStore } from "@/lib/upload/store";

interface UploadQueueItemProps {
  upload: UploadMetadata;
  compact?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getStatusIcon(status: UploadMetadata["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "uploading":
    case "initializing":
    case "completing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case "paused":
      return <Pause className="h-4 w-4 text-yellow-500" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusText(status: UploadMetadata["status"]): string {
  switch (status) {
    case "pending":
      return "En cola";
    case "initializing":
      return "Iniciando...";
    case "uploading":
      return "Subiendo...";
    case "paused":
      return "Pausado";
    case "completing":
      return "Finalizando...";
    case "completed":
      return "Completado";
    case "failed":
      return "Error";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}

export const UploadQueueItem = memo(function UploadQueueItem({
  upload,
  compact = false,
}: UploadQueueItemProps) {
  const { pauseUpload, resumeUpload, cancelUpload, removeUpload } =
    useUploadStore();

  const isActive =
    upload.status === "uploading" ||
    upload.status === "initializing" ||
    upload.status === "completing";
  const isPaused = upload.status === "paused";
  const isCompleted = upload.status === "completed";
  const isFailed = upload.status === "failed";
  const isCancelled = upload.status === "cancelled";
  const canPause = isActive;
  const canResume = isPaused;
  const canCancel = !isCompleted && !isCancelled;
  const canRemove = isCompleted || isFailed || isCancelled;

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1">
        {getStatusIcon(upload.status)}
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate">{upload.fileName}</p>
          <Progress value={upload.progress} className="h-1 mt-1" />
        </div>
        <span className="text-xs text-muted-foreground">
          {upload.progress}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        isCompleted &&
          "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900",
        isFailed &&
          "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
        isPaused &&
          "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{getStatusIcon(upload.status)}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{upload.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(upload.fileSize)} · {getStatusText(upload.status)}
            </p>
          </div>
        </div>

        {!isCompleted && !isCancelled && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>
                {upload.completedParts} / {upload.totalParts} partes
              </span>
              <span>{upload.progress}%</span>
            </div>
            <Progress value={upload.progress} className="h-2" />
          </div>
        )}

        {isFailed && upload.error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {upload.error}
          </p>
        )}

        <div className="flex items-center gap-1 mt-2">
          {canPause && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                pauseUpload(upload.id);
              }}
              className="h-7 px-2"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pausar
            </Button>
          )}

          {canResume && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                resumeUpload(upload.id);
              }}
              className="h-7 px-2"
            >
              <Play className="h-3 w-3 mr-1" />
              Reanudar
            </Button>
          )}

          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                cancelUpload(upload.id);
              }}
              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          )}

          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeUpload(upload.id);
              }}
              className="h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
