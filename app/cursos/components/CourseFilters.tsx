'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { CourseFilters } from '@/types/admin';

interface CourseFiltersProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
}

export function CourseFiltersComponent({ filters, onFiltersChange }: CourseFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título o autor..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Category Filter */}
        <Select
          value={filters.category}
          onValueChange={(value) => onFiltersChange({ ...filters, category: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="Finanzas">Finanzas</SelectItem>
            <SelectItem value="Marketing Digital">Marketing Digital</SelectItem>
            <SelectItem value="Operaciones">Operaciones</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Capital Humano">Capital Humano</SelectItem>
            <SelectItem value="Ventas">Ventas</SelectItem>
            <SelectItem value="Tecnología">Tecnología</SelectItem>
          </SelectContent>
        </Select>

        {/* Level Filter */}
        <Select
          value={filters.level}
          onValueChange={(value) => onFiltersChange({ ...filters, level: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            <SelectItem value="Básico">Básico</SelectItem>
            <SelectItem value="Intermedio">Intermedio</SelectItem>
            <SelectItem value="Avanzado">Avanzado</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Publicado">Publicado</SelectItem>
            <SelectItem value="Borrador">Borrador</SelectItem>
            <SelectItem value="Archivado">Archivado</SelectItem>
          </SelectContent>
        </Select>

        {/* Entity Filter */}
        <Select
          value={filters.entity}
          onValueChange={(value) => onFiltersChange({ ...filters, entity: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            <SelectItem value="COPARMEX">COPARMEX</SelectItem>
            <SelectItem value="Sponsor A">Sponsor A</SelectItem>
            <SelectItem value="Sponsor B">Sponsor B</SelectItem>
            <SelectItem value="Aliado">Aliado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
