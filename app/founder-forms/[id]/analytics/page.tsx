import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getFormAnalytics(formId: string) {
  // Get form details
  const form = await prisma.founderForm.findUnique({
    where: { id: formId },
  });

  if (!form) {
    return null;
  }

  // Get all responses for this form
  const responses = await prisma.founderFormResponse.findMany({
    where: { formId },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate overall statistics
  const totalResponses = responses.length;
  const completedResponses = responses.filter(
    (r) => r.status === 'completed'
  ).length;
  const inProgressResponses = responses.filter(
    (r) => r.status === 'in_progress'
  ).length;
  const notStartedResponses = responses.filter(
    (r) => r.status === 'not_started'
  ).length;
  const abandonedResponses = responses.filter(
    (r) => r.status === 'abandoned'
  ).length;

  const completionRate =
    totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

  // Calculate average completion time
  const completedWithTime = responses.filter(
    (r) => r.status === 'completed' && r.metadata.completedAt && r.metadata.startedAt
  );
  const avgTimeSpent =
    completedWithTime.length > 0
      ? completedWithTime.reduce((sum, r) => {
          const timeSpent = r.metadata.completedAt && r.metadata.startedAt
            ? new Date(r.metadata.completedAt).getTime() - new Date(r.metadata.startedAt).getTime()
            : 0;
          return sum + timeSpent;
        }, 0) / completedWithTime.length
      : 0;

  // Question-level analytics
  const questionAnalytics = form.questions
    .filter((q) => !q.isArchived)
    .map((question) => {
      const answersForQuestion = responses
        .flatMap((r) => r.answers)
        .filter((a) => a.questionId === question.id);

      const answeredCount = answersForQuestion.length;
      const answerRate =
        totalResponses > 0 ? (answeredCount / totalResponses) * 100 : 0;

      // Note: Individual question timing is not tracked in the current schema
      const avgTime = 0; // Will need to add timeSpent to answers if needed

      // Find drop-off rate (responses that started but didn't answer this question)
      const startedBeforeQuestion = responses.filter((r) => {
        const maxOrder = Math.max(
          ...r.answers.map((a) => {
            const q = form.questions.find((fq) => fq.id === a.questionId);
            return q?.order || 0;
          })
        );
        return maxOrder < question.order && r.answers.length > 0;
      }).length;

      return {
        id: question.id,
        label: question.label,
        section: question.section,
        order: question.order,
        type: question.type,
        required: question.required,
        answeredCount,
        answerRate,
        avgTimeSpent: avgTime,
        dropOffCount: startedBeforeQuestion,
      };
    });

  // Section-level analytics
  const sections = [...new Set(form.questions.map((q) => q.section))];
  const sectionAnalytics = sections.map((sectionName) => {
    const sectionQuestions = form.questions.filter(
      (q) => q.section === sectionName && !q.isArchived
    );
    const totalQuestions = sectionQuestions.length;

    // Count responses that completed this section (all questions answered)
    const completedCount = responses.filter((r) => {
      const sectionQuestionIds = sectionQuestions.map(q => q.id);
      const answeredSectionQuestions = r.answers.filter(
        a => sectionQuestionIds.includes(a.questionId)
      );
      return answeredSectionQuestions.length === totalQuestions;
    }).length;

    const completionRate =
      totalResponses > 0 ? (completedCount / totalResponses) * 100 : 0;

    // Note: Current section tracking not available in schema
    const currentCount = 0;

    // Note: Section-level timing not available in current schema
    const avgTime = 0;

    return {
      name: sectionName,
      totalQuestions,
      completedCount,
      completionRate,
      currentCount,
      avgTimeSpent: avgTime,
    };
  });

  // Daily trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyData = responses
    .filter((r) => r.createdAt >= thirtyDaysAgo)
    .reduce(
      (acc, response) => {
        const date = response.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { started: 0, completed: 0 };
        }
        acc[date].started++;
        if (response.status === 'completed') {
          acc[date].completed++;
        }
        return acc;
      },
      {} as Record<string, { started: number; completed: number }>
    );

  const dailyTrends = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    form,
    overview: {
      totalResponses,
      completedResponses,
      inProgressResponses,
      notStartedResponses,
      abandonedResponses,
      completionRate,
      avgTimeSpent,
    },
    questionAnalytics,
    sectionAnalytics,
    dailyTrends,
    recentResponses: responses.slice(0, 10),
  };
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  const analytics = await getFormAnalytics(id);

  if (!analytics) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-2">{analytics.form.name}</p>
      </div>

      {/* Analytics Dashboard */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <AnalyticsDashboard data={analytics} />
      </Suspense>
    </div>
  );
}
