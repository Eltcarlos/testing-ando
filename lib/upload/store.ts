/**
 * Zustand store for managing the upload queue
 * Coordinates between UI, IndexedDB, and Service Worker
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { UploadMetadata, UploadPart } from "./types";
import { CHUNK_SIZE, VALID_VIDEO_TYPES, MAX_FILE_SIZE } from "./constants";
import {
  saveUpload,
  getUpload,
  getAllUploads,
  getPendingUploads,
  deleteUpload,
  deleteChunksForUpload,
  storeFileAsChunks,
  updateUploadStatus,
} from "./storage";
import {
  registerUploadWorker,
  startUpload as workerStartUpload,
  pauseUpload as workerPauseUpload,
  resumeUpload as workerResumeUpload,
  cancelUpload as workerCancelUpload,
  subscribeToUpload,
  checkPendingUploads,
  isWorkerReady,
} from "./worker-client";

interface UploadStore {
  // State
  uploads: UploadMetadata[];
  isInitialized: boolean;
  workerReady: boolean;

  // Actions
  initialize: () => Promise<void>;
  addToQueue: (file: File) => Promise<string>;
  initializeUpload: (uploadId: string, file: File) => Promise<void>;
  startUpload: (uploadId: string) => void;
  pauseUpload: (uploadId: string) => void;
  resumeUpload: (uploadId: string) => void;
  cancelUpload: (uploadId: string) => Promise<void>;
  removeUpload: (uploadId: string) => Promise<void>;
  refreshUploads: () => Promise<void>;
  updateUploadFromWorker: (uploadId: string, updates: Partial<UploadMetadata>) => void;

  // Selectors
  getUploadById: (id: string) => UploadMetadata | undefined;
  getActiveUpload: () => UploadMetadata | undefined;
  getQueuedUploads: () => UploadMetadata[];
  getCompletedUploads: () => UploadMetadata[];
}

export const useUploadStore = create<UploadStore>()(
  subscribeWithSelector((set, get) => ({
    uploads: [],
    isInitialized: false,
    workerReady: false,

    initialize: async () => {
      if (get().isInitialized) return;

      try {
        // Register the Service Worker
        await registerUploadWorker();

        // Load existing uploads from IndexedDB
        const uploads = await getAllUploads();
        set({ uploads, isInitialized: true, workerReady: isWorkerReady() });

        // Subscribe to all worker messages
        subscribeToUpload("*", (event) => {
          const { type, uploadId, payload } = event.data;

          switch (type) {
            case "UPLOAD_PROGRESS":
              get().updateUploadFromWorker(uploadId, {
                status: payload.status,
                progress: payload.progress,
                completedParts: payload.completedParts,
              });
              break;
            case "UPLOAD_COMPLETE":
              get().updateUploadFromWorker(uploadId, {
                status: "completed",
                progress: 100,
                publicUrl: payload.publicUrl,
              });
              break;
            case "UPLOAD_ERROR":
              get().updateUploadFromWorker(uploadId, {
                status: "failed",
                error: payload.error,
              });
              break;
          }
        });

        // Check for any pending uploads and resume them
        const pending = await getPendingUploads();
        if (pending.length > 0) {
          checkPendingUploads();
        }
      } catch (error) {
        console.error("Failed to initialize upload store:", error);
      }
    },

    addToQueue: async (file: File) => {
      // Validate file
      if (!VALID_VIDEO_TYPES.includes(file.type)) {
        throw new Error("Invalid file type. Please select a valid video file.");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds maximum allowed (5GB).");
      }

      // Generate upload ID and calculate parts
      const uploadId = crypto.randomUUID();
      const parts: UploadPart[] = [];
      let partNumber = 1;
      let offset = 0;

      while (offset < file.size) {
        const start = offset;
        const end = Math.min(offset + CHUNK_SIZE, file.size);
        parts.push({
          partNumber,
          start,
          end,
          size: end - start,
          uploaded: false,
        });
        partNumber++;
        offset = end;
      }

      // Create upload metadata
      const upload: UploadMetadata = {
        id: uploadId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        s3Key: "",
        status: "pending",
        progress: 0,
        parts,
        completedParts: 0,
        totalParts: parts.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save metadata to IndexedDB
      await saveUpload(upload);

      // Store file chunks in IndexedDB
      await storeFileAsChunks(uploadId, file, parts);

      // Update store
      set((state) => ({
        uploads: [upload, ...state.uploads],
      }));

      // Initialize the upload (get S3 uploadId)
      await get().initializeUpload(uploadId, file);

      // Start processing if no other upload is active
      const activeUpload = get().getActiveUpload();
      if (!activeUpload || activeUpload.id === uploadId) {
        workerStartUpload(uploadId);
      }

      return uploadId;
    },

    initializeUpload: async (uploadId: string, file: File) => {
      try {
        // Get presigned URL and S3 upload ID
        const response = await fetch("/api/upload/multipart/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to initiate upload");
        }

        const { s3UploadId, s3Key, publicUrl, parts } = await response.json();

        // Update upload with S3 info
        const upload = await getUpload(uploadId);
        if (upload) {
          upload.s3UploadId = s3UploadId;
          upload.s3Key = s3Key;
          upload.publicUrl = publicUrl;
          upload.status = "initializing";
          upload.updatedAt = Date.now();
          await saveUpload(upload);

          get().updateUploadFromWorker(uploadId, {
            s3UploadId,
            s3Key,
            publicUrl,
            status: "initializing",
          });
        }
      } catch (error) {
        console.error("Failed to initialize upload:", error);
        await updateUploadStatus(uploadId, "failed", {
          error: error instanceof Error ? error.message : "Failed to initialize upload",
        });
        get().updateUploadFromWorker(uploadId, {
          status: "failed",
          error: error instanceof Error ? error.message : "Failed to initialize upload",
        });
      }
    },

    startUpload: (uploadId: string) => {
      workerStartUpload(uploadId);
    },

    pauseUpload: (uploadId: string) => {
      workerPauseUpload(uploadId);
    },

    resumeUpload: (uploadId: string) => {
      workerResumeUpload(uploadId);
    },

    cancelUpload: async (uploadId: string) => {
      workerCancelUpload(uploadId);
      await deleteChunksForUpload(uploadId);
    },

    removeUpload: async (uploadId: string) => {
      await deleteChunksForUpload(uploadId);
      await deleteUpload(uploadId);
      set((state) => ({
        uploads: state.uploads.filter((u) => u.id !== uploadId),
      }));
    },

    refreshUploads: async () => {
      const uploads = await getAllUploads();
      set({ uploads });
    },

    updateUploadFromWorker: (uploadId: string, updates: Partial<UploadMetadata>) => {
      set((state) => ({
        uploads: state.uploads.map((upload) =>
          upload.id === uploadId
            ? { ...upload, ...updates, updatedAt: Date.now() }
            : upload
        ),
      }));

      // If an upload completed, check queue for next upload
      if (updates.status === "completed" || updates.status === "failed" || updates.status === "cancelled") {
        const queued = get().getQueuedUploads();
        if (queued.length > 0) {
          const next = queued[0];
          workerStartUpload(next.id);
        }
      }
    },

    getUploadById: (id: string) => {
      return get().uploads.find((u) => u.id === id);
    },

    getActiveUpload: () => {
      return get().uploads.find(
        (u) => u.status === "uploading" || u.status === "initializing" || u.status === "completing"
      );
    },

    getQueuedUploads: () => {
      return get().uploads.filter((u) => u.status === "pending");
    },

    getCompletedUploads: () => {
      return get().uploads.filter((u) => u.status === "completed");
    },
  }))
);

// Helper hook for accessing specific upload
export function useUpload(uploadId: string) {
  return useUploadStore((state) => state.getUploadById(uploadId));
}

// Helper hook for active upload
export function useActiveUpload() {
  return useUploadStore((state) => state.getActiveUpload());
}

// Helper hook for checking if any uploads are in progress
export function useHasActiveUploads() {
  return useUploadStore((state) =>
    state.uploads.some(
      (u) =>
        u.status === "uploading" ||
        u.status === "pending" ||
        u.status === "initializing" ||
        u.status === "completing"
    )
  );
}

