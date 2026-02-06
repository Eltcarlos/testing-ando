import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import * as XLSX from "xlsx";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const querySchema = z.object({
  format: z.enum(["csv", "excel"]).default("excel"),
  status: z.enum(["not_started", "in_progress", "completed", "abandoned"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// GET - Export responses
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId } = await params;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      format: searchParams.get("format") || "excel",
      status: searchParams.get("status") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const validated = querySchema.parse(queryParams);

    // Get form
    const form = await prisma.founderForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Build filter
    const where: any = { formId };

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.dateFrom || validated.dateTo) {
      where.createdAt = {};
      if (validated.dateFrom) {
        where.createdAt.gte = new Date(validated.dateFrom);
      }
      if (validated.dateTo) {
        where.createdAt.lte = new Date(validated.dateTo);
      }
    }

    // Get responses
    const responses = await prisma.founderFormResponse.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Build export data
    const headers = [
      "ID",
      "Empresa",
      "Estado",
      "Progreso (%)",
      "Fecha Inicio",
      "Fecha Completado",
      "Última Actividad",
      ...form.questions.map((q) => q.label),
    ];

    const rows = responses.map((response) => {
      const baseData = [
        response.id,
        response.founderCompanyName,
        response.status,
        response.progress.percentage.toFixed(0),
        response.metadata.startedAt?.toISOString() || "",
        response.metadata.completedAt?.toISOString() || "",
        response.metadata.lastActivityAt?.toISOString() || "",
      ];

      // Add answers for each question
      const answerData = form.questions.map((question) => {
        const answer = response.answers.find((a) => a.questionId === question.id);
        if (!answer) return "";

        // Check if value is a file object with fileUrl
        if (typeof answer.value === "object" && answer.value !== null) {
          const valueObj = answer.value as any;
          if (valueObj.fileUrl) {
            return valueObj.fileUrl;
          }
        }

        return String(answer.value || "");
      });

      return [...baseData, ...answerData];
    });

    // Create workbook
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Respuestas");

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${form.slug}-respuestas-${timestamp}`;

    // Export based on format
    if (validated.format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting responses:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to export responses" },
      { status: 500 }
    );
  }
}
