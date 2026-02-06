/**
 * Service Worker client for upload communication
 * Provides methods to interact with the upload Service Worker
 */

import { UPLOAD_WORKER_PATH } from "./constants";
import type { WorkerMessage, WorkerMessageType } from "./types";

let swRegistration: ServiceWorkerRegistration | null = null;
let messageHandlers: Map<string, Set<(event: MessageEvent) => void>> = new Map();

/**
 * Register the upload Service Worker
 */
export async function registerUploadWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("Service Workers are not supported in this browser");
    return null;
  }

  try {
    swRegistration = await navigator.serviceWorker.register(UPLOAD_WORKER_PATH, {
      scope: "/",
    });

    // Set up message listener
    navigator.serviceWorker.addEventListener("message", handleWorkerMessage);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    console.log("Upload Service Worker registered successfully");
    return swRegistration;
  } catch (error) {
    console.error("Failed to register Upload Service Worker:", error);
    return null;
  }
}

/**
 * Get the current Service Worker registration
 */
export function getWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

/**
 * Send a message to the Service Worker
 */
export function sendToWorker(message: WorkerMessage): void {
  if (!navigator.serviceWorker.controller) {
    console.warn("No active Service Worker to send message to");
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Start an upload via the Service Worker
 */
export function startUpload(uploadId: string): void {
  sendToWorker({
    type: "START_UPLOAD",
    uploadId,
  });
}

/**
 * Pause an upload
 */
export function pauseUpload(uploadId: string): void {
  sendToWorker({
    type: "PAUSE_UPLOAD",
    uploadId,
  });
}

/**
 * Resume a paused upload
 */
export function resumeUpload(uploadId: string): void {
  sendToWorker({
    type: "RESUME_UPLOAD",
    uploadId,
  });
}

/**
 * Cancel an upload
 */
export function cancelUpload(uploadId: string): void {
  sendToWorker({
    type: "CANCEL_UPLOAD",
    uploadId,
  });
}

/**
 * Check for pending uploads and resume them
 */
export function checkPendingUploads(): void {
  sendToWorker({
    type: "CHECK_PENDING" as WorkerMessageType,
    uploadId: "",
  });
}

/**
 * Register Background Sync for network recovery
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!swRegistration) {
    console.warn("No Service Worker registration available");
    return false;
  }

  try {
    // Check if Background Sync is supported
    if ("sync" in swRegistration) {
      await (swRegistration as unknown as { sync: { register: (tag: string) => Promise<void> } })
        .sync.register("video-upload-sync");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to register background sync:", error);
    return false;
  }
}

/**
 * Handle messages from the Service Worker
 */
function handleWorkerMessage(event: MessageEvent): void {
  const { type, uploadId } = event.data;

  // Notify all registered handlers for this upload
  const handlers = messageHandlers.get(uploadId);
  if (handlers) {
    handlers.forEach((handler) => handler(event));
  }

  // Also notify global handlers
  const globalHandlers = messageHandlers.get("*");
  if (globalHandlers) {
    globalHandlers.forEach((handler) => handler(event));
  }
}

/**
 * Subscribe to upload messages for a specific upload ID
 * Use "*" to subscribe to all upload messages
 */
export function subscribeToUpload(
  uploadId: string,
  handler: (event: MessageEvent) => void
): () => void {
  if (!messageHandlers.has(uploadId)) {
    messageHandlers.set(uploadId, new Set());
  }

  messageHandlers.get(uploadId)!.add(handler);

  // Return unsubscribe function
  return () => {
    const handlers = messageHandlers.get(uploadId);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        messageHandlers.delete(uploadId);
      }
    }
  };
}

/**
 * Check if Service Worker is ready and active
 */
export function isWorkerReady(): boolean {
  return !!navigator.serviceWorker.controller;
}

/**
 * Wait for Service Worker to be ready
 */
export async function waitForWorkerReady(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  await navigator.serviceWorker.ready;
}

