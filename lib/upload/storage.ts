/**
 * IndexedDB storage layer for resumable uploads
 * Handles persistent storage of upload metadata and file chunks
 */

import { DB_NAME, DB_VERSION, UPLOADS_STORE, CHUNKS_STORE } from "./constants";
import type { UploadMetadata, UploadChunk, UploadPart } from "./types";

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize and get the IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction!;

      // Create uploads store for metadata
      if (!db.objectStoreNames.contains(UPLOADS_STORE)) {
        const uploadsStore = db.createObjectStore(UPLOADS_STORE, {
          keyPath: "id",
        });
        uploadsStore.createIndex("status", "status", { unique: false });
        uploadsStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create chunks store for file data
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        const chunksStore = db.createObjectStore(CHUNKS_STORE, {
          keyPath: ["uploadId", "partNumber"],
        });
        chunksStore.createIndex("uploadId", "uploadId", { unique: false });
      } else {
        // Ensure uploadId index exists on existing store (for upgrades)
        const chunksStore = transaction.objectStore(CHUNKS_STORE);
        if (!chunksStore.indexNames.contains("uploadId")) {
          chunksStore.createIndex("uploadId", "uploadId", { unique: false });
        }
      }
    };
  });

  return dbPromise;
}

// ==================== UPLOAD METADATA OPERATIONS ====================

/**
 * Save upload metadata
 */
export async function saveUpload(upload: UploadMetadata): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readwrite");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.put(upload);

    request.onerror = () => reject(new Error("Failed to save upload"));
    request.onsuccess = () => resolve();
  });
}

/**
 * Get upload metadata by ID
 */
export async function getUpload(id: string): Promise<UploadMetadata | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readonly");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.get(id);

    request.onerror = () => reject(new Error("Failed to get upload"));
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all uploads with a specific status
 */
export async function getUploadsByStatus(
  status: UploadMetadata["status"]
): Promise<UploadMetadata[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readonly");
    const store = transaction.objectStore(UPLOADS_STORE);
    const index = store.index("status");
    const request = index.getAll(status);

    request.onerror = () =>
      reject(new Error("Failed to get uploads by status"));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get all pending/in-progress uploads (for resume)
 */
export async function getPendingUploads(): Promise<UploadMetadata[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readonly");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(new Error("Failed to get pending uploads"));
    request.onsuccess = () => {
      const resumableStatuses = [
        "pending",
        "uploading",
        "paused",
        "initializing",
      ];
      const pending = (request.result as UploadMetadata[]).filter((upload) =>
        resumableStatuses.includes(upload.status)
      );
      resolve(pending);
    };
  });
}

/**
 * Get all uploads (for display)
 */
export async function getAllUploads(): Promise<UploadMetadata[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readonly");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(new Error("Failed to get all uploads"));
    request.onsuccess = () => {
      // Sort by createdAt descending
      const uploads = (request.result as UploadMetadata[]).sort(
        (a, b) => b.createdAt - a.createdAt
      );
      resolve(uploads);
    };
  });
}

/**
 * Update upload status
 */
export async function updateUploadStatus(
  id: string,
  status: UploadMetadata["status"],
  updates?: Partial<UploadMetadata>
): Promise<void> {
  const upload = await getUpload(id);
  if (!upload) throw new Error("Upload not found");

  await saveUpload({
    ...upload,
    ...updates,
    status,
    updatedAt: Date.now(),
  });
}

/**
 * Update upload progress
 */
export async function updateUploadProgress(
  id: string,
  progress: number,
  completedParts: number
): Promise<void> {
  const upload = await getUpload(id);
  if (!upload) throw new Error("Upload not found");

  await saveUpload({
    ...upload,
    progress,
    completedParts,
    updatedAt: Date.now(),
  });
}

/**
 * Mark a part as completed
 */
export async function markPartComplete(
  id: string,
  partNumber: number,
  etag: string
): Promise<void> {
  const upload = await getUpload(id);
  if (!upload) throw new Error("Upload not found");

  const parts = upload.parts.map((part) =>
    part.partNumber === partNumber ? { ...part, uploaded: true, etag } : part
  );

  const completedParts = parts.filter((p) => p.uploaded).length;
  const progress = Math.round((completedParts / upload.totalParts) * 100);

  await saveUpload({
    ...upload,
    parts,
    completedParts,
    progress,
    updatedAt: Date.now(),
  });
}

/**
 * Delete upload metadata
 */
export async function deleteUpload(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readwrite");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(new Error("Failed to delete upload"));
    request.onsuccess = () => resolve();
  });
}

// ==================== CHUNK OPERATIONS ====================

/**
 * Save a file chunk
 */
export async function saveChunk(chunk: UploadChunk): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, "readwrite");
    const store = transaction.objectStore(CHUNKS_STORE);
    const request = store.put(chunk);

    request.onerror = () => reject(new Error("Failed to save chunk"));
    request.onsuccess = () => resolve();
  });
}

/**
 * Get a specific chunk
 */
export async function getChunk(
  uploadId: string,
  partNumber: number
): Promise<UploadChunk | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, "readonly");
    const store = transaction.objectStore(CHUNKS_STORE);
    const request = store.get([uploadId, partNumber]);

    request.onerror = () => reject(new Error("Failed to get chunk"));
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all chunks for an upload
 */
export async function getChunksForUpload(
  uploadId: string
): Promise<UploadChunk[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, "readonly");
    const store = transaction.objectStore(CHUNKS_STORE);
    const index = store.index("uploadId");
    const request = index.getAll(uploadId);

    request.onerror = () => reject(new Error("Failed to get chunks"));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete a specific chunk
 */
export async function deleteChunk(
  uploadId: string,
  partNumber: number
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, "readwrite");
    const store = transaction.objectStore(CHUNKS_STORE);
    const request = store.delete([uploadId, partNumber]);

    request.onerror = () => reject(new Error("Failed to delete chunk"));
    request.onsuccess = () => resolve();
  });
}

/**
 * Delete all chunks for an upload
 */
export async function deleteChunksForUpload(uploadId: string): Promise<void> {
  const chunks = await getChunksForUpload(uploadId);
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, "readwrite");
    const store = transaction.objectStore(CHUNKS_STORE);

    let completed = 0;
    const total = chunks.length;

    if (total === 0) {
      resolve();
      return;
    }

    for (const chunk of chunks) {
      const request = store.delete([chunk.uploadId, chunk.partNumber]);
      request.onsuccess = () => {
        completed++;
        if (completed === total) resolve();
      };
      request.onerror = () => reject(new Error("Failed to delete chunks"));
    }
  });
}

// ==================== CLEANUP OPERATIONS ====================

/**
 * Clean up completed or cancelled uploads older than specified days
 */
export async function cleanupOldUploads(daysOld: number = 7): Promise<number> {
  const db = await getDB();
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  const uploads = await getAllUploads();
  const toDelete = uploads.filter(
    (upload) =>
      (upload.status === "completed" ||
        upload.status === "cancelled" ||
        upload.status === "failed") &&
      upload.updatedAt < cutoffTime
  );

  for (const upload of toDelete) {
    await deleteChunksForUpload(upload.id);
    await deleteUpload(upload.id);
  }

  return toDelete.length;
}

/**
 * Clear all upload data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [UPLOADS_STORE, CHUNKS_STORE],
      "readwrite"
    );
    transaction.objectStore(UPLOADS_STORE).clear();
    transaction.objectStore(CHUNKS_STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Failed to clear data"));
  });
}

// ==================== FILE CHUNKING UTILITY ====================

/**
 * Split a file into chunks and store them in IndexedDB
 */
export async function storeFileAsChunks(
  uploadId: string,
  file: File,
  parts: UploadPart[]
): Promise<void> {
  for (const part of parts) {
    const blob = file.slice(part.start, part.end);
    const arrayBuffer = await blob.arrayBuffer();

    await saveChunk({
      uploadId,
      partNumber: part.partNumber,
      data: arrayBuffer,
    });
  }
}
