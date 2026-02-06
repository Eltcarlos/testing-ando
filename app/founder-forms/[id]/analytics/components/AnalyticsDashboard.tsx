'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  form: {
    id: string;
    name: string;
    questions: unknown[];
  };
  overview: {
    totalResponses: number;
    completedResponses: number;
    inProgressResponses: number;
    notStartedResponses: number;
    abandonedResponses: number;
    completionRate: number;
    avgTimeSpent: number;
  };
  questionAnalytics: Array<{
    id: string;
    label: string;
    section: string;
    order: number;
    type: string;
    required: boolean;
    answeredCount: number;
    answerRate: number;
    avgTimeSpent: number;
    dropOffCount: number;
  }>;
  sectionAnalytics: Array<{
    name: string;
    totalQuestions: number;
    completedCount: number;
    completionRate: number;
    currentCount: number;
    avgTimeSpent: number;
  }>;
  dailyTrends: Array<{
    date: string;
    started: number;
    completed: number;
  }>;
  recentResponses: Array<{
    id: string;
    founderCompanyName: string;
    status: string;
    progress: { percentage: number };
    createdAt: Date;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const { overview, questionAnalytics, sectionAnalytics, dailyTrends, recentResponses } = data;

  // Format time (seconds to readable format)
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  // Colors for charts
  const colors = {
    completed: '#10b981',
    inProgress: '#f59e0b',
    notStarted: '#6b7280',
    abandoned: '#ef4444',
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Respuestas</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalResponses}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.completedResponses} completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.completedResponses} / {overview.totalResponses}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(overview.avgTimeSpent)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Para completar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Loader2 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.inProgressResponses}</div>
            <p className="text-xs text-gray-500 mt-1">Activas ahora</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">Por Sección</TabsTrigger>
          <TabsTrigger value="questions">Por Pregunta</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="users">Usuarios Activos</TabsTrigger>
        </TabsList>

        {/* Section Analytics */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempeño por Sección</CardTitle>
              <CardDescription>
                Tasa de completado y tiempo promedio por sección
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="completionRate"
                      fill="#3b82f6"
                      name="Tasa de Completado (%)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="currentCount"
                      fill="#f59e0b"
                      name="Usuarios Actuales"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Section Details Table */}
              <div className="mt-6 space-y-3">
                {sectionAnalytics.map((section) => (
                  <div
                    key={section.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{section.name}</h4>
                      <p className="text-sm text-gray-500">
                        {section.totalQuestions} preguntas
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          {section.completionRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">completado</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">
                          {section.currentCount}
                        </div>
                        <div className="text-xs text-gray-500">activos</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">
                          {formatTime(section.avgTimeSpent)}
                        </div>
                        <div className="text-xs text-gray-500">tiempo avg</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Question Analytics */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis por Pregunta</CardTitle>
              <CardDescription>
                Identifica preguntas problemáticas y puntos de abandono
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questionAnalytics
                  .sort((a, b) => a.order - b.order)
                  .map((question) => {
                    const isLowAnswer = question.answerRate < 50;
                    const isHighDropOff = question.dropOffCount > 5;

                    return (
                      <div
                        key={question.id}
                        className={cn(
                          'p-4 border rounded-lg hover:bg-gray-50 transition',
                          isHighDropOff && 'border-red-300 bg-red-50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-gray-500">
                                #{question.order}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {question.section}
                              </Badge>
                              {question.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Requerida
                                </Badge>
                              )}
                              {isHighDropOff && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs flex items-center gap-1"
                                >
                                  <AlertCircle className="w-3 h-3" />
                                  Alto abandono
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {question.label}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Tipo: {question.type}
                            </p>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <div
                                className={cn(
                                  'font-semibold',
                                  isLowAnswer ? 'text-red-600' : 'text-green-600'
                                )}
                              >
                                {question.answerRate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">respuesta</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-700">
                                {question.answeredCount}
                              </div>
                              <div className="text-xs text-gray-500">respondidas</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-blue-600">
                                {formatTime(question.avgTimeSpent)}
                              </div>
                              <div className="text-xs text-gray-500">tiempo avg</div>
                            </div>
                            {question.dropOffCount > 0 && (
                              <div className="text-right">
                                <div className="font-semibold text-red-600">
                                  {question.dropOffCount}
                                </div>
                                <div className="text-xs text-gray-500">abandonos</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={cn(
                                'h-1.5 rounded-full transition-all',
                                isLowAnswer ? 'bg-red-500' : 'bg-green-500'
                              )}
                              style={{ width: `${question.answerRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Diarias</CardTitle>
              <CardDescription>Respuestas iniciadas vs completadas (últimos 30 días)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => {
                        const d = new Date(date as string);
                        return d.toLocaleDateString('es-MX');
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="started"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Iniciadas"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Completadas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Respuestas Recientes</CardTitle>
              <CardDescription>Últimas 10 respuestas del formulario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentResponses.map((response) => (
                  <div
                    key={response.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {response.founderCompanyName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(response.createdAt).toLocaleString('es-MX')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          response.status === 'completed'
                            ? 'default'
                            : response.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {response.status}
                      </Badge>
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">Progreso</span>
                          <span className="font-semibold">
                            {response.progress.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${response.progress.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
