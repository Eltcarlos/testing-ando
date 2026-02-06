"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Video,
  X,
  Play,
} from "lucide-react";
import type { ModuleInput, LessonInput } from "@/lib/validations/course";
import { LessonType } from "@prisma/client";
import type { Video as VideoType } from "@prisma/client";
import { lessonTypeLabels, lessonTypeOptions } from "@/lib/enum-mappings";
import { cn } from "@/lib/utils";
import { VideoSelectorDialog } from "./VideoSelectorDialog";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { formatFileSize } from "@/lib/api/videos";

interface CourseModuleBuilderProps {
  modules: ModuleInput[];
  onChange: (modules: ModuleInput[]) => void;
  disabled?: boolean;
}

// Store selected video info for display (videoId -> video details)
type VideoInfo = { fileName: string; thumbnail?: string | null };

export function CourseModuleBuilder({
  modules,
  onChange,
  disabled = false,
}: CourseModuleBuilderProps) {
  // Only expand first module initially (accordion behavior)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.length > 0 ? [modules[0].id] : [])
  );
  const [videoSelectorOpen, setVideoSelectorOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState<{
    moduleId: string;
    lessonId: string;
  } | null>(null);
  // Cache video info for display purposes
  const [videoInfoCache, setVideoInfoCache] = useState<Map<string, VideoInfo>>(
    new Map()
  );
  // Video preview state
  const [videoPreview, setVideoPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Accordion behavior: only one module open at a time
  const toggleModuleExpand = (moduleId: string) => {
    if (expandedModules.has(moduleId)) {
      // Collapse if clicking on already expanded module
      setExpandedModules(new Set());
    } else {
      // Expand only this module, collapse others
      setExpandedModules(new Set([moduleId]));
    }
  };

  const addModule = () => {
    const newModule: ModuleInput = {
      id: `module-${Date.now()}`,
      title: "",
      description: "",
      order: modules.length + 1,
      lessons: [],
    };
    onChange([...modules, newModule]);
    // Only expand the new module (accordion behavior)
    setExpandedModules(new Set([newModule.id]));
  };

  const updateModule = (moduleId: string, updates: Partial<ModuleInput>) => {
    onChange(
      modules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m))
    );
  };

  const deleteModule = (moduleId: string) => {
    onChange(
      modules
        .filter((m) => m.id !== moduleId)
        .map((m, idx) => ({ ...m, order: idx + 1 }))
    );
    const newExpanded = new Set(expandedModules);
    newExpanded.delete(moduleId);
    setExpandedModules(newExpanded);
  };

  const addLesson = (moduleId: string) => {
    const currentModule = modules.find((m) => m.id === moduleId);
    if (!currentModule) return;

    const newLesson: LessonInput = {
      id: `lesson-${Date.now()}`,
      title: "",
      description: null,
      type: LessonType.video,
      isExternal: false,
      videoId: null,
      contentUrl: null,
      duration: null,
      order: currentModule.lessons.length + 1,
    };

    updateModule(moduleId, {
      lessons: [...currentModule.lessons, newLesson],
    });
  };

  const openVideoSelector = (moduleId: string, lessonId: string) => {
    setActiveLesson({ moduleId, lessonId });
    setVideoSelectorOpen(true);
  };

  const handleVideoSelect = (video: VideoType) => {
    if (!activeLesson) return;

    // Update the lesson with video info
    updateLesson(activeLesson.moduleId, activeLesson.lessonId, {
      videoId: video.id,
      contentUrl: video.url,
      duration: video.duration || null,
    });

    // Cache video info for display
    setVideoInfoCache((prev) => {
      const newCache = new Map(prev);
      newCache.set(video.id, {
        fileName: video.fileName,
        thumbnail: video.thumbnail,
      });
      return newCache;
    });

    setActiveLesson(null);
  };

  const clearVideoSelection = (moduleId: string, lessonId: string) => {
    updateLesson(moduleId, lessonId, {
      videoId: null,
      contentUrl: null,
      duration: null,
    });
  };

  const handleExternalToggle = (
    moduleId: string,
    lessonId: string,
    isExternal: boolean
  ) => {
    // Clear the opposite field when toggling
    if (isExternal) {
      // Switching to external: clear videoId
      updateLesson(moduleId, lessonId, {
        isExternal: true,
        videoId: null,
      });
    } else {
      // Switching to internal: clear contentUrl
      updateLesson(moduleId, lessonId, {
        isExternal: false,
        contentUrl: null,
        duration: null,
      });
    }
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    updates: Partial<LessonInput>
  ) => {
    const currentModule = modules.find((m) => m.id === moduleId);
    if (!currentModule) return;

    updateModule(moduleId, {
      lessons: currentModule.lessons.map((l) =>
        l.id === lessonId ? { ...l, ...updates } : l
      ),
    });
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    const currentModule = modules.find((m) => m.id === moduleId);
    if (!currentModule) return;

    updateModule(moduleId, {
      lessons: currentModule.lessons
        .filter((l) => l.id !== lessonId)
        .map((l, idx) => ({ ...l, order: idx + 1 })),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Módulos del Curso</Label>
        <Button type="button" onClick={addModule} size="sm" disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Módulo
        </Button>
      </div>

      <div className="space-y-2">
        {modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id);
          return (
            <Card key={module.id} className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="cursor-grab pt-1 shrink-0">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleModuleExpand(module.id)}
                          className="h-6 w-6 p-0"
                          disabled={disabled}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <CardTitle className="text-sm">
                          Módulo {moduleIndex + 1}
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteModule(module.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      <div>
                        <Label htmlFor={`module-title-${module.id}`} className="text-xs text-muted-foreground">
                          Título del módulo *
                        </Label>
                        <Input
                          id={`module-title-${module.id}`}
                          placeholder="Ej: Introducción al curso"
                          value={module.title}
                          onChange={(e) =>
                            updateModule(module.id, { title: e.target.value })
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`module-desc-${module.id}`} className="text-xs text-muted-foreground">
                          Descripción del módulo
                        </Label>
                        <Textarea
                          id={`module-desc-${module.id}`}
                          placeholder="Describe brevemente el contenido del módulo..."
                          value={module.description}
                          onChange={(e) =>
                            updateModule(module.id, {
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Lecciones</Label>
                    <Button
                      type="button"
                      onClick={() => addLesson(module.id)}
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Agregar Lección
                    </Button>
                  </div>

                  {module.lessons.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay lecciones. Agrega la primera lección.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isVideoType = lesson.type === LessonType.video;
                        const isExternal = lesson.isExternal ?? false;
                        const hasLinkedVideo = !isExternal && !!lesson.videoId;
                        const videoInfo = lesson.videoId
                          ? videoInfoCache.get(lesson.videoId)
                          : null;

                        return (
                          <div
                            key={lesson.id}
                            className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30 min-w-0"
                          >
                            <div className="cursor-grab pt-2 shrink-0">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 grid gap-2 min-w-0">
                              {/* Row 1: Title and Type */}
                              <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                  <Label htmlFor={`lesson-title-${lesson.id}`} className="text-xs text-muted-foreground">
                                    Título de la lección *
                                  </Label>
                                  <Input
                                    id={`lesson-title-${lesson.id}`}
                                    placeholder={`Lección ${lessonIndex + 1}`}
                                    value={lesson.title}
                                    onChange={(e) =>
                                      updateLesson(module.id, lesson.id, {
                                        title: e.target.value,
                                      })
                                    }
                                    className="text-sm"
                                    disabled={disabled}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`lesson-type-${lesson.id}`} className="text-xs text-muted-foreground">
                                    Tipo
                                  </Label>
                                  <Select
                                    value={lesson.type}
                                    onValueChange={(value: LessonType) =>
                                      updateLesson(module.id, lesson.id, {
                                        type: value,
                                      })
                                    }
                                    disabled={disabled}
                                  >
                                    <SelectTrigger id={`lesson-type-${lesson.id}`} className="text-sm">
                                      <SelectValue>
                                        {lessonTypeLabels[lesson.type]}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {lessonTypeOptions.map((opt) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Row 2: Description */}
                              <div>
                                <Label htmlFor={`lesson-desc-${lesson.id}`} className="text-xs text-muted-foreground">
                                  Descripción
                                </Label>
                                <Input
                                  id={`lesson-desc-${lesson.id}`}
                                  placeholder="Descripción de la lección (opcional)"
                                  value={lesson.description || ""}
                                  onChange={(e) =>
                                    updateLesson(module.id, lesson.id, {
                                      description: e.target.value || null,
                                    })
                                  }
                                  className="text-sm"
                                  disabled={disabled}
                                />
                              </div>

                              {/* Row 3: Video selection (only for video type) */}
                              {isVideoType && (
                                <>
                                  {/* External video checkbox */}
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`external-${lesson.id}`}
                                      checked={isExternal}
                                      onCheckedChange={(checked) =>
                                        handleExternalToggle(
                                          module.id,
                                          lesson.id,
                                          checked === true
                                        )
                                      }
                                      disabled={disabled}
                                    />
                                    <Label
                                      htmlFor={`external-${lesson.id}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      Video externo (URL manual)
                                    </Label>
                                  </div>

                                  {/* Video content based on isExternal */}
                                  {isExternal ? (
                                    /* External URL input */
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="col-span-2">
                                        <Label htmlFor={`lesson-url-${lesson.id}`} className="text-xs text-muted-foreground">
                                          URL del video *
                                        </Label>
                                        <Input
                                          id={`lesson-url-${lesson.id}`}
                                          placeholder="https://example.com/video.mp4"
                                          value={lesson.contentUrl || ""}
                                          onChange={(e) =>
                                            updateLesson(module.id, lesson.id, {
                                              contentUrl: e.target.value || null,
                                            })
                                          }
                                          className="text-sm"
                                          disabled={disabled}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`lesson-duration-${lesson.id}`} className="text-xs text-muted-foreground">
                                          Duración
                                        </Label>
                                        <Input
                                          id={`lesson-duration-${lesson.id}`}
                                          placeholder="Ej: 10:30"
                                          value={lesson.duration || ""}
                                          onChange={(e) =>
                                            updateLesson(module.id, lesson.id, {
                                              duration: e.target.value || null,
                                            })
                                          }
                                          className="text-sm"
                                          disabled={disabled}
                                        />
                                      </div>
                                    </div>
                                  ) : hasLinkedVideo ? (
                                    /* Selected video display */
                                    <div className="flex items-center gap-2 p-2 rounded border bg-background min-w-0 overflow-hidden">
                                      {/* Clickable thumbnail to preview video */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (lesson.contentUrl) {
                                            setVideoPreview({
                                              url: lesson.contentUrl,
                                              title:
                                                videoInfo?.fileName ||
                                                lesson.title ||
                                                "Video",
                                            });
                                          }
                                        }}
                                        className="shrink-0 w-12 h-8 rounded bg-muted flex items-center justify-center overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                        disabled={!lesson.contentUrl}
                                      >
                                        {videoInfo?.thumbnail ? (
                                          <img
                                            src={videoInfo.thumbnail}
                                            alt=""
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Video className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        {/* Play overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Play className="h-3 w-3 text-white" />
                                        </div>
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">
                                          {videoInfo?.fileName ||
                                            "Video seleccionado"}
                                        </p>
                                        {lesson.duration && (
                                          <p className="text-xs text-muted-foreground">
                                            {lesson.duration}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          openVideoSelector(
                                            module.id,
                                            lesson.id
                                          )
                                        }
                                        className="h-7 text-xs"
                                        disabled={disabled}
                                      >
                                        Cambiar
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          clearVideoSelection(
                                            module.id,
                                            lesson.id
                                          )
                                        }
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                        disabled={disabled}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    /* Video selector button */
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          openVideoSelector(
                                            module.id,
                                            lesson.id
                                          )
                                        }
                                        className="text-sm"
                                        disabled={disabled}
                                      >
                                        <Video className="h-4 w-4 mr-2" />
                                        Seleccionar Video
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Non-video type: show regular URL and duration */}
                              {!isVideoType && (
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2">
                                    <Label htmlFor={`lesson-content-${lesson.id}`} className="text-xs text-muted-foreground">
                                      URL del contenido
                                    </Label>
                                    <Input
                                      id={`lesson-content-${lesson.id}`}
                                      placeholder="https://example.com/resource"
                                      value={lesson.contentUrl || ""}
                                      onChange={(e) =>
                                        updateLesson(module.id, lesson.id, {
                                          contentUrl: e.target.value || null,
                                        })
                                      }
                                      className="text-sm"
                                      disabled={disabled}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`lesson-dur-${lesson.id}`} className="text-xs text-muted-foreground">
                                      Duración
                                    </Label>
                                    <Input
                                      id={`lesson-dur-${lesson.id}`}
                                      placeholder="Ej: 15 min"
                                      value={lesson.duration || ""}
                                      onChange={(e) =>
                                        updateLesson(module.id, lesson.id, {
                                          duration: e.target.value || null,
                                        })
                                      }
                                      className="text-sm"
                                      disabled={disabled}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLesson(module.id, lesson.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={disabled}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay módulos. Agrega el primer módulo para comenzar.</p>
        </div>
      )}

      {/* Video Selector Dialog */}
      <VideoSelectorDialog
        open={videoSelectorOpen}
        onOpenChange={setVideoSelectorOpen}
        onSelect={handleVideoSelect}
        selectedVideoId={
          activeLesson
            ? modules
                .find((m) => m.id === activeLesson.moduleId)
                ?.lessons.find((l) => l.id === activeLesson.lessonId)?.videoId
            : null
        }
      />

      {/* Video Preview Dialog */}
      <Dialog
        open={!!videoPreview}
        onOpenChange={(open) => !open && setVideoPreview(null)}
      >
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="truncate">{videoPreview?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {videoPreview && (
              <VideoPlayer url={videoPreview.url} height={450} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
