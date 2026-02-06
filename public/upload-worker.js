/**
 * Service Worker for background video uploads
 * Handles multipart uploads with retry logic and background sync
 */

// Configuration
const DB_NAME = "video-uploads";
const DB_VERSION = 3; // Must match the version in lib/upload/constants.ts
const UPLOADS_STORE = "uploads";
const CHUNKS_STORE = "chunks";
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;
const BACKGROUND_SYNC_TAG = "video-upload-sync";

// Store active uploads
const activeUploads = new Map();

// ==================== IndexedDB HELPERS ====================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const transaction = event.target.transaction;

      // Create uploads store for metadata
      if (!db.objectStoreNames.contains(UPLOADS_STORE)) {
        const uploadsStore = db.createObjectStore(UPLOADS_STORE, { keyPath: "id" });
        uploadsStore.createIndex("status", "status", { unique: false });
        uploadsStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create chunks store for file data
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        const chunksStore = db.createObjectStore(CHUNKS_STORE, { keyPath: ["uploadId", "partNumber"] });
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
}

async function getUpload(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readonly");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.get(id);
    request.onerror = () => reject(new Error("Failed to get upload"));
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function saveUpload(upload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readwrite");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.put(upload);
    request.onerror = () => reject(new Error("Failed to save upload"));
    request.onsuccess = () => resolve();
  });
}

async function getChunk(uploadId, partNumber) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, "readonly");
    const store = transaction.objectStore(CHUNKS_STORE);
    const request = store.get([uploadId, partNumber]);
    request.onerror = () => reject(new Error("Failed to get chunk"));
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function deleteChunk(uploadId, partNumber) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, "readwrite");
    const store = transaction.objectStore(CHUNKS_STORE);
    const request = store.delete([uploadId, partNumber]);
    request.onerror = () => reject(new Error("Failed to delete chunk"));
    request.onsuccess = () => resolve();
  });
}

async function getPendingUploads() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADS_STORE, "readonly");
    const store = transaction.objectStore(UPLOADS_STORE);
    const request = store.getAll();
    request.onerror = () => reject(new Error("Failed to get uploads"));
    request.onsuccess = () => {
      const resumable = ["pending", "uploading", "paused", "initializing"];
      const pending = request.result.filter((u) => resumable.includes(u.status));
      resolve(pending);
    };
  });
}

// ==================== UPLOAD LOGIC ====================

async function uploadPart(upload, part, retryCount = 0) {
  try {
    // Get presigned URL
    const presignResponse = await fetch("/api/upload/multipart/presign-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        s3Key: upload.s3Key,
        s3UploadId: upload.s3UploadId,
        partNumber: part.partNumber,
      }),
    });

    if (!presignResponse.ok) {
      throw new Error("Failed to get presigned URL");
    }

    const { presignedUrl } = await presignResponse.json();

    // Get chunk data from IndexedDB
    const chunk = await getChunk(upload.id, part.partNumber);
    if (!chunk) {
      throw new Error(`Chunk ${part.partNumber} not found`);
    }

    // Upload the part
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: chunk.data,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    // Get ETag from response headers
    const etag = uploadResponse.headers.get("ETag");
    if (!etag) {
      throw new Error("No ETag returned from S3");
    }

    return etag.replace(/"/g, ""); // Remove quotes from ETag
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return uploadPart(upload, part, retryCount + 1);
    }
    throw error;
  }
}

async function processUpload(uploadId) {
  // Check if already processing
  if (activeUploads.get(uploadId) === "processing") {
    return;
  }

  activeUploads.set(uploadId, "processing");

  try {
    let upload = await getUpload(uploadId);
    if (!upload) {
      throw new Error("Upload not found");
    }

    // Skip if already completed or cancelled
    if (upload.status === "completed" || upload.status === "cancelled") {
      activeUploads.delete(uploadId);
      return;
    }

    // Update status to uploading
    upload.status = "uploading";
    upload.updatedAt = Date.now();
    await saveUpload(upload);
    broadcastProgress(upload);

    // Get incomplete parts
    const incompleteParts = upload.parts.filter((p) => !p.uploaded);

    for (const part of incompleteParts) {
      // Check if paused or cancelled
      upload = await getUpload(uploadId);
      if (upload.status === "paused" || upload.status === "cancelled") {
        activeUploads.delete(uploadId);
        return;
      }

      try {
        const etag = await uploadPart(upload, part);

        // Update part status
        upload = await getUpload(uploadId);
        upload.parts = upload.parts.map((p) =>
          p.partNumber === part.partNumber
            ? { ...p, uploaded: true, etag }
            : p
        );
        upload.completedParts = upload.parts.filter((p) => p.uploaded).length;
        upload.progress = Math.round((upload.completedParts / upload.totalParts) * 100);
        upload.updatedAt = Date.now();
        await saveUpload(upload);

        // Delete chunk from IndexedDB to free space
        await deleteChunk(uploadId, part.partNumber);

        // Broadcast progress
        broadcastProgress(upload);
      } catch (error) {
        console.error(`Failed to upload part ${part.partNumber}:`, error);
        upload = await getUpload(uploadId);
        upload.status = "failed";
        upload.error = error.message;
        upload.updatedAt = Date.now();
        await saveUpload(upload);
        broadcastError(upload, error.message);
        activeUploads.delete(uploadId);
        return;
      }
    }

    // All parts uploaded - complete the upload
    upload = await getUpload(uploadId);
    upload.status = "completing";
    upload.updatedAt = Date.now();
    await saveUpload(upload);

    const completeParts = upload.parts
      .filter((p) => p.uploaded && p.etag)
      .map((p) => ({ partNumber: p.partNumber, etag: p.etag }));

    const completeResponse = await fetch("/api/upload/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        s3Key: upload.s3Key,
        s3UploadId: upload.s3UploadId,
        parts: completeParts,
        fileName: upload.fileName,
        fileSize: upload.fileSize,
      }),
    });

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload");
    }

    const { videoId, publicUrl } = await completeResponse.json();

    // Update upload as completed
    upload.status = "completed";
    upload.publicUrl = publicUrl;
    upload.progress = 100;
    upload.updatedAt = Date.now();
    await saveUpload(upload);

    broadcastComplete(upload, videoId, publicUrl);
  } catch (error) {
    console.error("Upload processing error:", error);
    const upload = await getUpload(uploadId);
    if (upload) {
      upload.status = "failed";
      upload.error = error.message;
      upload.updatedAt = Date.now();
      await saveUpload(upload);
      broadcastError(upload, error.message);
    }
  } finally {
    activeUploads.delete(uploadId);
  }
}

async function pauseUpload(uploadId) {
  const upload = await getUpload(uploadId);
  if (upload && upload.status === "uploading") {
    upload.status = "paused";
    upload.updatedAt = Date.now();
    await saveUpload(upload);
    activeUploads.delete(uploadId);
    broadcastProgress(upload);
  }
}

async function cancelUpload(uploadId) {
  const upload = await getUpload(uploadId);
  if (!upload) return;

  upload.status = "cancelled";
  upload.updatedAt = Date.now();
  await saveUpload(upload);
  activeUploads.delete(uploadId);

  // Abort S3 multipart upload if it was initiated
  if (upload.s3UploadId && upload.s3Key) {
    try {
      await fetch("/api/upload/multipart/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key: upload.s3Key,
          s3UploadId: upload.s3UploadId,
        }),
      });
    } catch (error) {
      console.error("Failed to abort S3 upload:", error);
    }
  }

  broadcastProgress(upload);
}

// ==================== BROADCAST HELPERS ====================

function broadcastProgress(upload) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "UPLOAD_PROGRESS",
        uploadId: upload.id,
        payload: {
          uploadId: upload.id,
          status: upload.status,
          progress: upload.progress,
          completedParts: upload.completedParts,
          totalParts: upload.totalParts,
        },
      });
    });
  });
}

function broadcastComplete(upload, videoId, publicUrl) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "UPLOAD_COMPLETE",
        uploadId: upload.id,
        payload: {
          uploadId: upload.id,
          videoId,
          publicUrl,
        },
      });
    });
  });
}

function broadcastError(upload, error) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "UPLOAD_ERROR",
        uploadId: upload.id,
        payload: {
          uploadId: upload.id,
          error,
          recoverable: true,
        },
      });
    });
  });
}

// ==================== EVENT HANDLERS ====================

// Handle messages from main thread
self.addEventListener("message", async (event) => {
  const { type, uploadId } = event.data;

  switch (type) {
    case "START_UPLOAD":
      processUpload(uploadId);
      break;
    case "PAUSE_UPLOAD":
      pauseUpload(uploadId);
      break;
    case "RESUME_UPLOAD":
      processUpload(uploadId);
      break;
    case "CANCEL_UPLOAD":
      cancelUpload(uploadId);
      break;
    case "CHECK_PENDING":
      // Check for any pending uploads and resume them
      const pending = await getPendingUploads();
      for (const upload of pending) {
        if (upload.status === "uploading" || upload.status === "pending") {
          processUpload(upload.id);
        }
      }
      break;
  }
});

// Handle install event
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Handle activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Resume any pending uploads
      getPendingUploads().then((pending) => {
        for (const upload of pending) {
          if (upload.status === "uploading") {
            processUpload(upload.id);
          }
        }
      }),
    ])
  );
});

// Handle background sync (for resume after network recovery)
self.addEventListener("sync", async (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(
      getPendingUploads().then((pending) => {
        return Promise.all(
          pending
            .filter((u) => u.status === "uploading" || u.status === "pending")
            .map((u) => processUpload(u.id))
        );
      })
    );
  }
});

// Handle online event (when network comes back)
self.addEventListener("online", async () => {
  const pending = await getPendingUploads();
  for (const upload of pending) {
    if (upload.status === "uploading" || upload.status === "failed") {
      processUpload(upload.id);
    }
  }
});

