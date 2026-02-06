import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // 1. Buscar si el usuario tiene una invitación activa por su correo
        let invitation = await prisma.founderInvitation.findFirst({
            where: {
                email: session.user.email,
                status: { in: ['pending', 'sent', 'opened'] }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Si no tiene invitación, buscar el formulario por defecto para "aliados" o "partners"
        let formId = invitation?.formId;

        if (!invitation) {
            // Buscamos un formulario que tenga el slug 'aliados' o similar como default
            const defaultForm = await prisma.founderForm.findFirst({
                where: {
                    OR: [
                        { slug: 'aliados' },
                        { slug: 'partners' },
                        { slug: 'empresas-fundadoras' },
                        { name: { contains: 'Aliado' } },
                        { name: { contains: 'Fundadora' } }
                    ],
                    status: 'active'
                }
            });

            if (!defaultForm) {
                return NextResponse.json({ error: "No se encontró un formulario de onboarding para socios" }, { status: 404 });
            }

            formId = defaultForm.id;

            // Opcional: Crear una invitación automática si no existe para vincular la respuesta correctamente
            invitation = await prisma.founderInvitation.create({
                data: {
                    formId: defaultForm.id,
                    email: session.user.email,
                    companyName: (session.user as any).companyName || 'Mi Empresa',
                    contactName: session.user.name || 'Socio',
                    token: crypto.randomUUID(),
                    status: 'opened',
                }
            });
        }

        // 3. Obtener el formulario
        const form = await prisma.founderForm.findUnique({
            where: { id: formId },
        });

        if (!form) {
            return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });
        }

        // 4. Buscar el usuario y su registro de onboarding
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { onboarding: true }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json({
            form: {
                ...form,
                questions: form.questions.filter(q => !q.isArchived).sort((a, b) => a.order - b.order)
            },
            invitation,
            response: user.onboarding ? {
                id: user.onboarding.id,
                status: user.onboarding.has_finalized ? "completed" : "in_progress",
                answers: Array.isArray(user.onboarding.raw_answers)
                    ? (user.onboarding.raw_answers as any[]).map((a) => ({
                        questionId: a.key || a.questionId,
                        value: a.answer || a.value
                    }))
                    : [],
                progress: {
                    totalQuestions: form.questions.filter(q => !q.isArchived).length,
                    answeredQuestions: Array.isArray(user.onboarding.raw_answers) ? user.onboarding.raw_answers.length : 0,
                    percentage: Array.isArray(user.onboarding.raw_answers) ? (user.onboarding.raw_answers.length / form.questions.filter(q => !q.isArchived).length) * 100 : 0
                }
            } : null
        });

    } catch (error) {
        console.error("Error fetching my onboarding form:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
