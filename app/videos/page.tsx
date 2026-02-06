"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Copy, Trash2, Play, Loader2, RefreshCw } from "lucide-react";
import { fetchVideos, deleteVideo, formatFileSize } from "@/lib/api/videos";
import { VideoPlayer } from "@/components/video";
import type { Video } from "@prisma/client";
import Image from "next/image";
import { toast } from "sonner";

export default function VideosAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const queryClient = useQueryClient();

  // Fetch videos query
  const {
    data: videos = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["videos", searchQuery],
    queryFn: () => fetchVideos(searchQuery || undefined),
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast.success("Video eliminado correctamente");
    },
    onError: () => {
      toast.error("Error al eliminar el video");
    },
  });

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada al portapapeles");
  };

  const handleDelete = (video: Video) => {
    if (!confirm("¿Estás seguro de eliminar este video?")) return;
    deleteMutation.mutate(video.id);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Videos</h1>
          <p className="text-muted-foreground mt-1">
            {videos.length} videos subidos
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No se encontraron videos
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Intenta con otro término de búsqueda"
              : "Sube tu primer video para comenzar"}
          </p>
        </div>
      ) : (
        /* Video Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <button
                onClick={() => setSelectedVideo(video)}
                className="relative h-48 w-full bg-muted group cursor-pointer"
              >
                {video.thumbnail ? (
                  <Image
                    src={video.thumbnail}
                    alt={video.fileName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {/* Play overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                    <Play className="ml-1 size-7" />
                  </div>
                </div>
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                )}
              </button>

              <CardContent className="p-4 space-y-3">
                {/* File Name */}
                <div>
                  <h3
                    className="font-semibold text-sm line-clamp-2"
                    title={video.fileName}
                  >
                    {video.fileName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(video.size)}</span>
                    <span>•</span>
                    <span>{formatDate(video.uploadedAt)}</span>
                  </div>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={video.url}
                      readOnly
                      className="text-xs font-mono h-8"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(video.url)}
                      className="h-8 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(video.url)}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copiar URL
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(video)}
                    disabled={deleteMutation.isPending}
                    className="px-2"
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables === video.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <DialogTitle className="text-white text-lg pr-8 line-clamp-1">
              {selectedVideo?.fileName}
            </DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <VideoPlayer
              url={selectedVideo.url}
              width="100%"
              height="auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
