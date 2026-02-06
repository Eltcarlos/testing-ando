"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadStore } from "@/lib/upload/store";
import { UploadStatusBar } from "./UploadStatusBar";

interface UploadStatusProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes the upload system
 * and renders the global upload status bar
 */
export function UploadStatusProvider({ children }: UploadStatusProviderProps) {
  const { initialize, isInitialized, uploads } = useUploadStore();
  const queryClient = useQueryClient();
  const previousCompletedCountRef = useRef(0);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Invalidate videos query when a new upload completes
  useEffect(() => {
    const completedCount = uploads.filter(
      (u) => u.status === "completed"
    ).length;

    // Only invalidate if completed count increased (new upload finished)
    if (completedCount > previousCompletedCountRef.current) {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    }

    previousCompletedCountRef.current = completedCount;
  }, [uploads, queryClient]);

  return (
    <>
      {children}
      <UploadStatusBar />
    </>
  );
}
