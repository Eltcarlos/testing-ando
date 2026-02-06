"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Upload,
  CheckCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUploadStore, useHasActiveUploads } from "@/lib/upload/store";
import { UploadQueueItem } from "./UploadQueueItem";

export function UploadStatusBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { uploads } = useUploadStore();
  const hasActiveUploads = useHasActiveUploads();

  // Get counts
  const activeCount = uploads.filter(
    (u) =>
      u.status === "uploading" ||
      u.status === "pending" ||
      u.status === "initializing" ||
      u.status === "completing"
  ).length;

  const completedCount = uploads.filter((u) => u.status === "completed").length;
  const failedCount = uploads.filter((u) => u.status === "failed").length;

  // Get current upload
  const currentUpload = uploads.find(
    (u) =>
      u.status === "uploading" ||
      u.status === "initializing" ||
      u.status === "completing"
  );

  // Don't show if no uploads
  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 flex flex-col-reverse">
      {/* Collapsed bar - rendered first in DOM but appears at bottom due to flex-col-reverse */}
      <div
        className={cn(
          "bg-background border rounded-lg shadow-lg overflow-hidden transition-all duration-200",
          hasActiveUploads && "border-blue-500 ring-2 ring-blue-500/20"
        )}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              hasActiveUploads
                ? "bg-blue-100 dark:bg-blue-900"
                : completedCount === uploads.length
                ? "bg-green-100 dark:bg-green-900"
                : "bg-muted"
            )}
          >
            {hasActiveUploads ? (
              <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            ) : completedCount === uploads.length ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Upload className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-left">
            {currentUpload ? (
              <>
                <p className="text-sm font-medium truncate">
                  {currentUpload.fileName}
                </p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={currentUpload.progress}
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-muted-foreground">
                    {currentUpload.progress}%
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {completedCount === uploads.length
                    ? "Subidas completadas"
                    : `${activeCount} subida(s) pendiente(s)`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {completedCount} de {uploads.length} completado(s)
                </p>
              </>
            )}
          </div>

          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </div>

      {/* Expanded panel - rendered second in DOM but appears above due to flex-col-reverse */}
      <div
        className={cn(
          "mb-2 bg-background border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-out",
          isExpanded
            ? "opacity-100 translate-y-0 max-h-96"
            : "opacity-0 translate-y-4 max-h-0 pointer-events-none"
        )}
      >
        <div className="p-3 border-b bg-muted/50">
          <h3 className="font-semibold text-sm">Cola de subida</h3>
          <p className="text-xs text-muted-foreground">
            {activeCount} activo(s) · {completedCount} completado(s)
            {failedCount > 0 && ` · ${failedCount} error(es)`}
          </p>
        </div>
        <ScrollArea className="max-h-72">
          <div className="p-2 space-y-2">
            {uploads.map((upload) => (
              <UploadQueueItem key={upload.id} upload={upload} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

