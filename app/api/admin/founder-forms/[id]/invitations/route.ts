import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createInvitationSchema, invitationFiltersSchema } from "@/lib/validations/founder-form";
import { randomBytes } from "crypto";
import { MongoClient, ObjectId } from "mongodb";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper to generate unique token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// GET - List invitations for a form
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId } = await params;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      formId,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
    };

    const validated = invitationFiltersSchema.parse(queryParams);

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

    // Build filter
    const where: any = {
      formId,
    };

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.search) {
      where.OR = [
        { email: { contains: validated.search, mode: "insensitive" } },
        { companyName: { contains: validated.search, mode: "insensitive" } },
        { contactName: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // Fetch invitations
    const [invitations, total] = await Promise.all([
      prisma.founderInvitation.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: validated.offset,
        take: validated.limit,
      }),
      prisma.founderInvitation.count({ where }),
    ]);

    console.log('Fetched invitations:', invitations);
    console.log('Total count:', total);

    return NextResponse.json({
      data: invitations,
      pagination: {
        limit: validated.limit,
        offset: validated.offset,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST - Create new invitation
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: formId } = await params;
    const body = await request.json();

    const validated = createInvitationSchema.parse(body);

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

    // Check if invitation already exists for this email
    const existingInvitation = await prisma.founderInvitation.findFirst({
      where: {
        formId,
        email: validated.email,
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate unique token
    let token = generateToken();

    // Ensure token is unique (very unlikely to collide, but check anyway)
    while (await prisma.founderInvitation.findUnique({ where: { token } })) {
      token = generateToken();
    }

    // Create invitation using MongoDB client directly to avoid transaction issues
    const mongoClient = new MongoClient(process.env.DATABASE_URL!);

    try {
      await mongoClient.connect();
      const db = mongoClient.db();
      const collection = db.collection('founder_invitations');

      const invitationData = {
        formId: new ObjectId(formId),
        token,
        email: validated.email,
        companyName: validated.companyName,
        contactName: validated.contactName,
        phone: validated.phone || null,
        status: "pending",
        responseId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sentAt: null,
        openedAt: null,
        completedAt: null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        sentBy: null,
        emailSent: false,
        emailOpenedCount: 0,
      };

      const result = await collection.insertOne(invitationData);

      const invitation = {
        id: result.insertedId.toString(),
        ...invitationData,
        formId: formId,
      };

      return NextResponse.json(invitation, { status: 201 });
    } finally {
      await mongoClient.close();
    }
  } catch (error) {
    console.error("Error creating invitation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid invitation data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
