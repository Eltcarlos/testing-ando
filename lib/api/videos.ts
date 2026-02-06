import type { Video } from "@prisma/client";

/**
 * Fetch all videos with optional search filter
 */
export async function fetchVideos(search?: string): Promise<Video[]> {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }

  const url = `/api/videos${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch videos");
  }

  return response.json();
}

/**
 * Delete a video
 */
export async function deleteVideo(id: string): Promise<void> {
  const response = await fetch(`/api/videos/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete video");
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
