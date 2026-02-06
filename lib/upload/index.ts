// Types
export * from "./types";

// Constants
export * from "./constants";

// Storage (IndexedDB)
export {
  saveUpload,
  getUpload,
  getAllUploads,
  getPendingUploads,
  deleteUpload,
  updateUploadStatus,
  updateUploadProgress,
  markPartComplete,
  saveChunk,
  getChunk,
  deleteChunk,
  deleteChunksForUpload,
  cleanupOldUploads,
  storeFileAsChunks,
} from "./storage";

// Store (Zustand)
export {
  useUploadStore,
  useUpload,
  useActiveUpload,
  useHasActiveUploads,
} from "./store";

// Worker Client
export {
  registerUploadWorker,
  startUpload,
  pauseUpload,
  resumeUpload,
  cancelUpload,
  checkPendingUploads,
  subscribeToUpload,
  isWorkerReady,
  waitForWorkerReady,
} from "./worker-client";

