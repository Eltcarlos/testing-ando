"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface VideoPlayerProps {
  url: string;
  width?: number | string;
  height?: number | string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// VideoPlayer Component
// ============================================================================

function VideoPlayerComponent({
  url,
  width = "100%",
  height = "auto",
}: VideoPlayerProps) {
  // Refs
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [bufferedPercent, setBufferedPercent] = React.useState(0);

  // Volume state
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [prevVolume, setPrevVolume] = React.useState(1);

  // UI state
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [isBuffering, setIsBuffering] = React.useState(false);
  const [isSeeking, setIsSeeking] = React.useState(false);

  // ============================================================================
  // Video Event Handlers
  // ============================================================================

  const handleLoadedMetadata = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, []);

  const handleTimeUpdate = React.useCallback(() => {
    const video = videoRef.current;
    if (!video || isSeeking) return;
    setCurrentTime(video.currentTime);
  }, [isSeeking]);

  const handleProgress = React.useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;

    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBufferedPercent((bufferedEnd / video.duration) * 100);
    }
  }, []);

  const handlePlay = React.useCallback(() => setIsPlaying(true), []);
  const handlePause = React.useCallback(() => setIsPlaying(false), []);
  const handleWaiting = React.useCallback(() => setIsBuffering(true), []);
  const handleCanPlay = React.useCallback(() => setIsBuffering(false), []);

  // ============================================================================
  // Control Actions
  // ============================================================================

  const togglePlay = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = React.useCallback(
    (value: number[]) => {
      const video = videoRef.current;
      if (!video) return;

      const newTime = (value[0] / 100) * duration;
      video.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  const handleSeekStart = React.useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleSeekEnd = React.useCallback(() => {
    setIsSeeking(false);
  }, []);

  const handleVolumeChange = React.useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      const restoreVolume = prevVolume > 0 ? prevVolume : 0.5;
      video.volume = restoreVolume;
      video.muted = false;
      setVolume(restoreVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      video.volume = 0;
      video.muted = true;
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, prevVolume]);

  const toggleFullscreen = React.useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, []);

  // ============================================================================
  // Controls Visibility
  // ============================================================================

  const showControlsTemporarily = React.useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying]);

  const handleMouseMove = React.useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleMouseLeave = React.useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  // ============================================================================
  // Keyboard Controls
  // ============================================================================

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(duration, video.currentTime + 5);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange([Math.min(100, volume * 100 + 10)]);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume * 100 - 10)]);
          break;
      }

      showControlsTemporarily();
    },
    [
      togglePlay,
      toggleMute,
      toggleFullscreen,
      duration,
      volume,
      handleVolumeChange,
      showControlsTemporarily,
    ]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // Listen for fullscreen changes (from browser controls or Escape key)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Show controls when paused
  React.useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isPlaying]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Cancel video download on unmount
  // Use a ref to track mounted state to avoid StrictMode issues
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    const video = videoRef.current;

    return () => {
      isMountedRef.current = false;

      // Use requestAnimationFrame to defer cleanup
      // This ensures we don't interfere with StrictMode's double-mounting
      requestAnimationFrame(() => {
        // Only cleanup if we're actually unmounted
        if (!isMountedRef.current && video) {
          video.pause();
          video.src = "";
          video.load();
        }
      });
    };
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-black",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      style={{ width, height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full object-contain"
        preload="auto"
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
      />

      {/* Loading Spinner */}
      {isBuffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-12 animate-spin text-white/80" />
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          aria-label="Play video"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105">
            <Play className="ml-1 size-8" />
          </div>
        </button>
      )}

      {/* Controls Container */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-12 transition-opacity duration-300",
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div className="mb-3 flex items-center gap-2">
          {/* Buffered Progress Background */}
          <div className="relative h-1.5 flex-1 rounded-full bg-white/20">
            {/* Buffered indicator */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Seek Slider */}
            <Slider
              value={[progressPercent]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              className="absolute inset-0 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-none [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:transition-opacity hover:[&_[data-slot=slider-thumb]]:opacity-100 [&_[data-slot=slider-track]]:bg-transparent"
            />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={togglePlay}
                  className="flex size-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="size-5" />
                  ) : (
                    <Play className="ml-0.5 size-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isPlaying ? "Pause (Space)" : "Play (Space)"}
              </TooltipContent>
            </Tooltip>

            {/* Volume Controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleMute}
                    className="flex size-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="size-5" />
                    ) : (
                      <Volume2 className="size-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isMuted ? "Unmute (M)" : "Mute (M)"}
                </TooltipContent>
              </Tooltip>

              <Slider
                value={[isMuted ? 0 : volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-none [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/30"
              />
            </div>

            {/* Time Display */}
            <div className="ml-2 select-none text-sm text-white/90">
              <span className="tabular-nums">{formatTime(currentTime)}</span>
              <span className="mx-1 text-white/60">/</span>
              <span className="tabular-nums text-white/60">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Fullscreen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleFullscreen}
                  className="flex size-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20"
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize className="size-5" />
                  ) : (
                    <Maximize className="size-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with React.memo to prevent unnecessary re-renders from parent
export const VideoPlayer = React.memo(VideoPlayerComponent);
