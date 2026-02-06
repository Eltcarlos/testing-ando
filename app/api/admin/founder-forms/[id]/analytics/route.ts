import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get analytics for a form
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId } = await params;

    // Check if form exists
    const form = await prisma.founderForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Get all responses
    const responses = await prisma.founderFormResponse.findMany({
      where: { formId },
    });

    const total = responses.length;
    const notStarted = responses.filter((r) => r.status === "not_started").length;
    const inProgress = responses.filter((r) => r.status === "in_progress").length;
    const completed = responses.filter((r) => r.status === "completed").length;
    const abandoned = responses.filter((r) => r.status === "abandoned").length;

    // Calculate completion rate
    const completionRate = total > 0 ? completed / total : 0;

    // Calculate average time to complete (in seconds)
    const completedResponses = responses.filter(
      (r) => r.status === "completed" && r.metadata.completedAt
    );

    const avgTimeToComplete =
      completedResponses.length > 0
        ? completedResponses.reduce((sum, r) => {
            const timeSpent = r.metadata.completedAt
              ? (r.metadata.completedAt.getTime() - r.metadata.startedAt.getTime()) / 1000
              : 0;
            return sum + timeSpent;
          }, 0) / completedResponses.length
        : null;

    // Get responses by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResponses = responses.filter(
      (r) => r.createdAt >= thirtyDaysAgo
    );

    // Group by day
    const responsesByDay = new Map<string, number>();
    recentResponses.forEach((r) => {
      const dateKey = r.createdAt.toISOString().split("T")[0];
      responsesByDay.set(dateKey, (responsesByDay.get(dateKey) || 0) + 1);
    });

    const responsesByDayArray = Array.from(responsesByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalInvited: total,
      notStarted,
      inProgress,
      completed,
      abandoned,
      completionRate,
      avgTimeToComplete,
      responsesByDay: responsesByDayArray,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
