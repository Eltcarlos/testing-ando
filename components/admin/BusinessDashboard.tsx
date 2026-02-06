'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BusinessData,
  FilterOptions,
  applyFilters,
  generateBusinessData,
  SECTIONS,
  COMPANY_SIZES,
  formatMoney,
} from '@/lib/business-analytics-data';
import { BusinessMap } from './BusinessMap';
import { BusinessFilters } from './BusinessFilters';

// Chart colors matching the HTML design
const CHART_COLORS = ['#6EE7F9', '#A78BFA', '#F472B6', '#FCD34D', '#60A5FA', '#34D399'];

export function BusinessDashboard() {
  const [allData] = useState<BusinessData[]>(() => generateBusinessData(5737));
  const [filters, setFilters] = useState<FilterOptions>({
    sector: '*',
    size: '*',
    city: '*',
  });

  const filteredData = useMemo(() => applyFilters(allData, filters), [allData, filters]);

  // KPIs
  const kpis = useMemo(() => {
    const count = filteredData.length;
    const avgRevenue = count > 0
      ? filteredData.reduce((sum, d) => sum + d.annual_revenue_mxn, 0) / count / 1e6
      : 0;
    const avgEmployees = count > 0
      ? filteredData.reduce((sum, d) => sum + d.employees, 0) / count
      : 0;
    const avgUsage = count > 0
      ? filteredData.reduce((sum, d) => sum + d.weekly_minutes, 0) / count
      : 0;

    return { count, avgRevenue, avgEmployees, avgUsage };
  }, [filteredData]);

  // Sector distribution
  const sectorData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      counts[d.sector] = (counts[d.sector] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Size distribution
  const sizeData = useMemo(() => {
    const counts: Record<string, number> = {
      Micro: 0,
      Pequeña: 0,
      Mediana: 0,
      Grande: 0,
    };
    filteredData.forEach(d => {
      counts[d.size]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Section visits
  const sectionData = useMemo(() => {
    const totals = SECTIONS.map(section => ({
      section,
      visits: filteredData.reduce((sum, d) => sum + (d.visits[section] || 0), 0),
    }));
    return totals;
  }, [filteredData]);

  // Revenue histogram (binned)
  const revenueHistogram = useMemo(() => {
    const bins: { range: string; count: number }[] = [];
    const binCount = 20;
    const revenues = filteredData.map(d => d.annual_revenue_mxn);
    const min = Math.min(...revenues);
    const max = Math.max(...revenues);
    const binSize = (max - min) / binCount;

    for (let i = 0; i < binCount; i++) {
      const start = min + i * binSize;
      const end = min + (i + 1) * binSize;
      const count = revenues.filter(r => r >= start && r < end).length;
      bins.push({
        range: `${(start / 1e6).toFixed(0)}-${(end / 1e6).toFixed(0)}M`,
        count,
      });
    }
    return bins;
  }, [filteredData]);

  // Activity by size
  const activityBySize = useMemo(() => {
    return COMPANY_SIZES.map(size => {
      const subset = filteredData.filter(d => d.size === size);
      const count = subset.length;
      if (count === 0) {
        return { size, courses: 0, connections: 0, ai: 0 };
      }
      return {
        size,
        courses: subset.reduce((sum, d) => sum + d.courses_taken, 0) / count,
        connections: subset.reduce((sum, d) => sum + d.community_connections, 0) / count,
        ai: subset.reduce((sum, d) => sum + d.ai_messages, 0) / count,
      };
    });
  }, [filteredData]);

  // Scatter data (sample for performance)
  const scatterData = useMemo(() => {
    return filteredData
      .slice(0, Math.min(1500, filteredData.length))
      .map(d => ({
        revenue: d.annual_revenue_mxn,
        usage: d.weekly_minutes,
        employees: d.employees,
      }));
  }, [filteredData]);

  const sectorChartConfig: ChartConfig = {
    count: { label: 'Empresas', color: '#6EE7F9' },
  };

  const sectionChartConfig: ChartConfig = {
    visits: { label: 'Visitas', color: '#A78BFA' },
  };

  const activityChartConfig: ChartConfig = {
    courses: { label: 'Cursos', color: '#6EE7F9' },
    connections: { label: 'Conexiones', color: '#A78BFA' },
    ai: { label: 'Mensajes IA', color: '#F472B6' },
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <BusinessFilters filters={filters} onFilterChange={setFilters} />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">Empresas usuarias</div>
          <div className="text-3xl font-bold">{kpis.count.toLocaleString()}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">
            Facturación anual promedio (MM MXN)
          </div>
          <div className="text-3xl font-bold">{kpis.avgRevenue.toFixed(2)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">Empleados promedio</div>
          <div className="text-3xl font-bold">{Math.round(kpis.avgEmployees).toLocaleString()}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">
            Uso semanal promedio (min)
          </div>
          <div className="text-3xl font-bold">{Math.round(kpis.avgUsage).toLocaleString()}</div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Distribución de sectores</h3>
          <ChartContainer config={sectorChartConfig} className="h-[360px]">
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="sector"
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#6EE7F9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Distribución por tamaño de empresa</h3>
          <ChartContainer config={{}} className="h-[360px]">
            <PieChart>
              <Pie
                data={sizeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {sizeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-xl">
                      <div className="font-medium">{payload[0].name}</div>
                      <div className="text-sm text-muted-foreground">
                        {payload[0].value?.toLocaleString()} empresas
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ChartContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">
            Distribución de facturación anual (MXN)
          </h3>
          <ChartContainer config={{ count: { label: 'Empresas', color: '#A78BFA' } }} className="h-[360px]">
            <BarChart data={revenueHistogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#A78BFA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Secciones más visitadas (total)</h3>
          <ChartContainer config={sectionChartConfig} className="h-[360px]">
            <BarChart data={sectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="section" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="visits" fill="#F472B6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      {/* Map */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Mapa de empresas usuarias</h3>
        <BusinessMap data={filteredData} />
      </Card>

      {/* Charts Row 3 */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">
          Relación entre facturación anual y uso semanal
        </h3>
        <ChartContainer config={{}} className="h-[420px]">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="revenue"
              name="Facturación"
              tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
            />
            <YAxis type="number" dataKey="usage" name="Uso semanal (min)" />
            <ZAxis type="number" dataKey="employees" range={[20, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-xl">
                    <div className="text-sm">
                      <div>Facturación: {formatMoney(data.revenue)}</div>
                      <div>Uso: {Math.round(data.usage)} min/semana</div>
                      <div>{data.employees} empleados</div>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={scatterData} fill="#6EE7F9" fillOpacity={0.6} />
          </ScatterChart>
        </ChartContainer>
      </Card>

      {/* Activity by size */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">
          Cursos, conexiones en comunidad y mensajes a IA (promedio por tamaño)
        </h3>
        <ChartContainer config={activityChartConfig} className="h-[420px]">
          <BarChart data={activityBySize}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="size" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="courses" fill="#6EE7F9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="connections" fill="#A78BFA" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ai" fill="#F472B6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  );
}
