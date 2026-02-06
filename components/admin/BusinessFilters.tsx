'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilterOptions, SECTORS, COMPANY_SIZES, CITIES } from '@/lib/business-analytics-data';

interface BusinessFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export function BusinessFilters({ filters, onFilterChange }: BusinessFiltersProps) {
  const handleReset = () => {
    onFilterChange({ sector: '*', size: '*', city: '*' });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 min-w-[200px]">
        <label htmlFor="sector" className="text-sm font-medium whitespace-nowrap">
          Sector
        </label>
        <Select
          value={filters.sector}
          onValueChange={(value) => onFilterChange({ ...filters, sector: value })}
        >
          <SelectTrigger id="sector" className="flex-1">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="*">Todos</SelectItem>
            {SECTORS.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 min-w-[180px]">
        <label htmlFor="size" className="text-sm font-medium whitespace-nowrap">
          Tamaño
        </label>
        <Select
          value={filters.size}
          onValueChange={(value) => onFilterChange({ ...filters, size: value })}
        >
          <SelectTrigger id="size" className="flex-1">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="*">Todos</SelectItem>
            {COMPANY_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 min-w-[180px]">
        <label htmlFor="city" className="text-sm font-medium whitespace-nowrap">
          Ciudad
        </label>
        <Select
          value={filters.city}
          onValueChange={(value) => onFilterChange({ ...filters, city: value })}
        >
          <SelectTrigger id="city" className="flex-1">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="*">Todas</SelectItem>
            {CITIES.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        onClick={handleReset}
        className="ml-auto"
      >
        Restablecer filtros
      </Button>
    </div>
  );
}
