"use client";

import { useState, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Video, Check, FileVideo, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchVideos, formatFileSize } from "@/lib/api/videos";
import type { Video as VideoType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface VideoSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (video: VideoType) => void;
  selectedVideoId?: string | null;
}

export function VideoSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  selectedVideoId,
}: VideoSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(
    selectedVideoId || null
  );

  // Fetch videos
  const {
    data: videos = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["videos"],
    queryFn: () => fetchVideos(),
    enabled: open,
  });

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter((video) =>
      video.fileName.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  // Reset local selection when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalSelectedId(selectedVideoId || null);
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  const handleSelect = (video: VideoType) => {
    setLocalSelectedId(video.id);
  };

  const handleConfirm = () => {
    const selectedVideo = videos.find((v) => v.id === localSelectedId);
    if (selectedVideo) {
      onSelect(selectedVideo);
      onOpenChange(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Video</DialogTitle>
          <DialogDescription>
            Selecciona un video de la biblioteca para usar en esta lección.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar videos por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Video List */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
              <Video className="h-12 w-12 text-destructive/50 mb-2" />
              <p className="text-destructive">Error al cargar videos</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Intenta de nuevo"}
              </p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
              <FileVideo className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="font-medium">No hay videos disponibles</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No se encontraron videos con ese nombre"
                  : "Sube videos primero para poder seleccionarlos"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredVideos.map((video) => {
                const isSelected = localSelectedId === video.id;
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => handleSelect(video)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                      "hover:bg-accent",
                      isSelected && "bg-primary/10 border border-primary"
                    )}
                  >
                    {/* Thumbnail or placeholder */}
                    <div className="shrink-0 w-20 h-14 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.fileName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {video.duration && <span>{video.duration}</span>}
                        <span>{formatFileSize(video.size)}</span>
                        <span>{formatDate(video.uploadedAt)}</span>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!localSelectedId}
          >
            Seleccionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
