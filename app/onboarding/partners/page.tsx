'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FounderFormClient } from '../../forms/[slug]/components/FounderFormClient';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

function OnboardingPartnersContent() {
    const { data: session, update } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>(null);
    const [invitation, setInvitation] = useState<any>(null);
    const [response, setResponse] = useState<any>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        // Si no hay token Y no hay sesión después de cargar, entonces es un error
        if (!token && session === undefined) return; // Wait for session to load

        if (!token && !session) {
            setError('Se requiere un token de acceso o una sesión activa.');
            setLoading(false);
            return;
        }

        async function loadForm() {
            try {
                setLoading(true);
                setError(null);

                // Fetch form data using the token OR the current session
                const url = token ? `/api/forms/${token}` : `/api/forms/me`;
                const res = await fetch(url);

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'No se pudo cargar el formulario');
                }

                const data = await res.json();

                if (data.form) {
                    setFormData(data.form);
                    setInvitation(data.invitation);
                    setResponse(data.response);

                    // If already completed in DB, show success state immediately
                    if (data.response?.status === 'completed') {
                        setIsCompleted(true);
                    }
                } else {
                    setError('La estructura del formulario no es válida.');
                }
            } catch (err: any) {
                console.error('Error loading onboarding form:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadForm();
    }, [token, session]);

    const handleComplete = () => {
        setIsCompleted(true);
        if (session) {
            update({ onboardingCompleted: true });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse font-mono tracking-widest text-xs uppercase">Cargando experiencia de onboarding...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
                </div>

                <Card className="max-w-md w-full shadow-2xl relative z-10">
                    <CardHeader className="text-center pt-10">
                        <div className="mx-auto bg-destructive/10 w-24 h-24 rounded-3xl flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight uppercase">Acceso Denegado</CardTitle>
                        <CardDescription className="text-lg mt-3 leading-relaxed">
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-6">
                        <p className="text-muted-foreground text-sm">
                            Este enlace puede haber expirado por seguridad o ser inválido. Por favor, solicita uno nuevo a tu contacto en Crece tu Negocio.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-10">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="px-10 h-12 font-bold uppercase tracking-widest text-xs"
                        >
                            Ir al Inicio
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
                </div>

                <Card className="max-w-2xl w-full shadow-2xl relative z-10 overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                    <CardHeader className="text-center pt-14 px-10">
                        <div className="mx-auto bg-primary/10 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-6 group-hover:rotate-0 transition-transform duration-700">
                            <CheckCircle2 className="h-14 w-14 text-primary" />
                        </div>
                        <CardTitle className="text-5xl font-black tracking-tighter uppercase mb-4 italic">¡Confirmado!</CardTitle>
                        <CardDescription className="text-xl leading-relaxed font-medium">
                            Excelente trabajo, <span className="text-primary font-black uppercase italic">{invitation?.contactName || 'Aliado'}</span>.
                            Toda la información ha sido recibida y procesada correctamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6 py-10 border-y my-6 mx-10">
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Nuestro equipo estratégico comenzará a revisar el perfil de <strong className="text-foreground uppercase italic">{invitation?.companyName || 'tu empresa'}</strong> de inmediato.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg">Registro verificado</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg">Perfil en revisión</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg">Acceso pendiente</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-14 pt-4">
                        <Button
                            size="lg"
                            className="px-14 h-16 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] italic text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                            onClick={() => router.push('/')}
                        >
                            Ir al Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Reuse the existing premium form client with the callback
    return (
        <div className="min-h-screen bg-background selection:bg-primary/30">
            <FounderFormClient
                form={formData}
                invitation={invitation}
                existingResponse={response}
                token={token}
                onComplete={handleComplete}
            />
        </div>
    );
}

export default function OnboardingPartnersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse font-mono tracking-widest text-xs uppercase">Cargando...</p>
            </div>
        }>
            <OnboardingPartnersContent />
        </Suspense>
    );
}
