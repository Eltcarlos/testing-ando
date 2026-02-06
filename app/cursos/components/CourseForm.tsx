"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseModuleBuilder } from "./CourseModuleBuilder";
import type { Course } from "@prisma/client";
import {
  CourseCategory,
  CourseLevel,
  CourseStatus,
  Currency,
} from "@prisma/client";
import type { CreateCourseInput, ModuleInput } from "@/lib/validations/course";
import {
  categoryOptions,
  levelOptions,
  statusOptions,
  currencyOptions,
  categoryLabels,
  levelLabels,
  statusLabels,
  currencyLabels,
} from "@/lib/enum-mappings";

interface CourseFormProps {
  /** Initial course data for editing, null for creating new */
  initialData?: Course | null;
  /** Called when form is submitted */
  onSubmit: (data: CreateCourseInput) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Loading state during submission */
  isLoading?: boolean;
}

/** Default empty form data with Prisma enum types */
function getEmptyFormData(): CreateCourseInput {
  return {
    title: "",
    description: "",
    category: CourseCategory.finance,
    level: CourseLevel.basic,
    instructor: {
      name: "",
      bio: "",
      avatar: null,
    },
    entity: "COPARMEX",
    thumbnail: null,
    duration: "",
    language: "es",
    price: {
      isFree: true,
      amount: null,
      currency: Currency.mxn,
    },
    prerequisites: [],
    tags: [],
    modules: [],
    status: CourseStatus.draft,
    featured: false,
    isNew: false,
  };
}

/** Convert Course from API to form data format */
function courseToFormData(course: Course): CreateCourseInput {
  const instructor = course.instructor as {
    name: string;
    bio: string;
    avatar?: string | null;
  };
  const price = course.price as {
    isFree: boolean;
    amount?: number | null;
    currency: Currency;
  };
  const modules = (course.modules as ModuleInput[]) || [];

  return {
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    instructor: {
      name: instructor?.name || "",
      bio: instructor?.bio || "",
      avatar: instructor?.avatar || null,
    },
    entity: course.entity,
    thumbnail: course.thumbnail,
    duration: course.duration,
    language: course.language,
    price: {
      isFree: price?.isFree ?? true,
      amount: price?.amount ?? null,
      currency: price?.currency ?? Currency.mxn,
    },
    prerequisites: course.prerequisites,
    tags: course.tags,
    modules,
    status: course.status,
    featured: course.featured,
    isNew: course.isNew,
  };
}

export function CourseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CourseFormProps) {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<CreateCourseInput>(() =>
    initialData ? courseToFormData(initialData) : getEmptyFormData()
  );
  const [newTag, setNewTag] = useState("");
  const [newPrereq, setNewPrereq] = useState("");

  // Re-initialize form when initialData changes (e.g., on navigation)
  useEffect(() => {
    if (initialData) {
      setFormData(courseToFormData(initialData));
    } else {
      setFormData(getEmptyFormData());
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const addPrereq = () => {
    if (
      newPrereq.trim() &&
      !formData.prerequisites.includes(newPrereq.trim())
    ) {
      setFormData({
        ...formData,
        prerequisites: [...formData.prerequisites, newPrereq.trim()],
      });
      setNewPrereq("");
    }
  };

  const removePrereq = (prereq: string) => {
    setFormData({
      ...formData,
      prerequisites: formData.prerequisites.filter((p) => p !== prereq),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col min-h-0 pt-6">
          <Tabs defaultValue="basic" className="flex flex-col flex-1 min-h-0">
            {/* Tabs - responsive: 2x2 grid on mobile, 4 columns on desktop */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 shrink-0 h-auto">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">
                Básico
              </TabsTrigger>
              <TabsTrigger value="instructor" className="text-xs sm:text-sm">
                Instructor
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs sm:text-sm">
                Detalles
              </TabsTrigger>
              <TabsTrigger value="modules" className="text-xs sm:text-sm">
                Módulos
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent
              value="basic"
              className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1"
            >
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Título del Curso *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ej: Contabilidad Básica para MIPyMEs"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe de qué trata el curso..."
                    rows={4}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Responsive 2-col on desktop, 1-col on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoría *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: CourseCategory) =>
                        setFormData({ ...formData, category: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id="category">
                        <SelectValue>
                          {categoryLabels[formData.category]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="level">Nivel *</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value: CourseLevel) =>
                        setFormData({ ...formData, level: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id="level">
                        <SelectValue>{levelLabels[formData.level]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {levelOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entity">Entidad/Proveedor *</Label>
                    <Select
                      value={formData.entity}
                      onValueChange={(value) =>
                        setFormData({ ...formData, entity: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id="entity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COPARMEX">COPARMEX</SelectItem>
                        <SelectItem value="Sponsor A">Sponsor A</SelectItem>
                        <SelectItem value="Sponsor B">Sponsor B</SelectItem>
                        <SelectItem value="Aliado">Aliado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Estado *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: CourseStatus) =>
                        setFormData({ ...formData, status: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id="status">
                        <SelectValue>
                          {statusLabels[formData.status]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="thumbnail">URL de Imagen/Thumbnail</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thumbnail: e.target.value || null,
                      })
                    }
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Instructor Tab */}
            <TabsContent
              value="instructor"
              className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1"
            >
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="instructorName">
                    Nombre del Instructor *
                  </Label>
                  <Input
                    id="instructorName"
                    value={formData.instructor.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructor: {
                          ...formData.instructor,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej: María González"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="instructorBio">
                    Biografía del Instructor *
                  </Label>
                  <Textarea
                    id="instructorBio"
                    value={formData.instructor.bio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructor: {
                          ...formData.instructor,
                          bio: e.target.value,
                        },
                      })
                    }
                    placeholder="Experiencia, credenciales, especialidad..."
                    rows={4}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="instructorAvatar">
                    URL Avatar del Instructor
                  </Label>
                  <Input
                    id="instructorAvatar"
                    value={formData.instructor.avatar || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructor: {
                          ...formData.instructor,
                          avatar: e.target.value || null,
                        },
                      })
                    }
                    placeholder="https://example.com/avatar.jpg"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent
              value="details"
              className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1"
            >
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duración</Label>
                    <Input
                      id="duration"
                      value={formData.duration ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="Ej: 8 horas, 4 semanas"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Input
                      id="language"
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                      placeholder="es"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isFree"
                      checked={formData.price.isFree}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          price: { ...formData.price, isFree: checked },
                        })
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor="isFree">Curso Gratuito</Label>
                  </div>

                  {!formData.price.isFree && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Precio</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={formData.price.amount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price: {
                                ...formData.price,
                                amount: parseFloat(e.target.value) || null,
                              },
                            })
                          }
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Moneda</Label>
                        <Select
                          value={formData.price.currency}
                          onValueChange={(value: Currency) =>
                            setFormData({
                              ...formData,
                              price: { ...formData.price, currency: value },
                            })
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger id="currency">
                            <SelectValue>
                              {currencyLabels[formData.price.currency]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {currencyOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags/Palabras Clave</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                      placeholder="Agregar tag..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      disabled={isLoading}
                      className="shrink-0"
                    >
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                <div>
                  <Label>Prerrequisitos</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Input
                      value={newPrereq}
                      onChange={(e) => setNewPrereq(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addPrereq())
                      }
                      placeholder="Agregar prerrequisito..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addPrereq}
                      variant="outline"
                      disabled={isLoading}
                      className="shrink-0"
                    >
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {formData.prerequisites.map((prereq, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border bg-muted/30"
                      >
                        <span className="text-sm">{prereq}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrereq(prereq)}
                          className="h-6 text-destructive"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured & New toggles - responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, featured: checked })
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor="featured">Destacado</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="isNew"
                      checked={formData.isNew}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isNew: checked })
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor="isNew">Nuevo</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent
              value="modules"
              className="flex-1 overflow-y-auto mt-4 pr-1"
            >
              <CourseModuleBuilder
                modules={formData.modules}
                onChange={(modules) => setFormData({ ...formData, modules })}
                disabled={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer actions - sticky at bottom */}
      <div className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t mt-4 bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Curso"}
        </Button>
      </div>
    </form>
  );
}
