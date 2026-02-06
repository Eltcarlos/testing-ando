'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, User } from '@/store/authStore';
import { useUsersStore } from '@/store/usersStore';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore(state => state.setUser);
  const setUsersStoreUser = useUsersStore(state => state.setUser);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast.success('Código enviado', {
        description: 'Revisa tu email para obtener el código de verificación',
      });
      setStep('otp');
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('email-otp', {
        email,
        token: otp,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Código incorrecto o expirado');
      }

      if (result?.ok) {
        // Fetch session and populate auth store before redirect
        try {
          const sessRes = await fetch('/api/auth/session');
          const sess = await sessRes.json();
          // Get info user by id from session
          const userRes = await fetch(`/api/users/${sess.user.id}`);
          const userData: User = await userRes.json();
          // Populate auth store
          setUser(userData);

          // Also fetch users list from API and populate usersStore with the matching user
          try {
            const allRes = await fetch('/api/users');
            if (allRes.ok) {
              const response = await allRes.json();
              const users = response.data || response;
              const matched = users.find((u: any) => u.email === userData.email);
              if (matched) {
                const mapped = {
                  id: matched.id,
                  name: matched.fullName || matched.name || matched.email,
                  email: matched.email,
                  avatar: matched.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(matched.fullName || matched.email)}`,
                  role: matched.role, // Usa el rol real de la base de datos
                  company: matched.companyName || matched.company || '',
                  phone: matched.phone || '',
                  joinedAt: matched.createdAt ? new Date(matched.createdAt) : new Date(),
                  lastActive: matched.updatedAt ? new Date(matched.updatedAt) : undefined,
                  status: matched.status || 'active',
                  metrics: matched.metrics || {},
                  settings: matched.settings || {},
                } as any;
                setUsersStoreUser(mapped);
              }
            }
          } catch (e) {
            console.warn('Could not fetch users to populate usersStore', e);
          }

        } catch (err) {
          console.warn('Could not fetch session to populate store', err);
        }

        toast.success('¡Bienvenido!', {
          description: 'Inicio de sesión exitoso',
        });
        router.push('/'); // Redirige a / para que app/page.tsx maneje la redirección según el rol
        router.refresh();
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'Código incorrecto. Intenta de nuevo.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast.success('Código reenviado', {
        description: 'Se ha enviado un nuevo código a tu email',
      });
      setOtp('');
    } catch (err) {
      console.error('Error resending OTP:', err);
      toast.error('Error al reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="relative w-24 h-24">
              <Image
                src="/logo.png"
                alt="COPARMEX Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {step === 'email' ? 'Iniciar sesión' : 'Verificación'}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 'email'
                ? 'Ingresa tu email para recibir un código de acceso'
                : 'Ingresa el código de 6 dígitos enviado a tu email'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@coparmex.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 text-base"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Recibirás un código de 6 dígitos en tu email
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-center block">
                  Código de verificación
                </Label>
                <div className="flex justify-center py-2">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-14 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-14 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-14 w-12 text-lg" />
                      <InputOTPSlot index={3} className="h-14 w-12 text-lg" />
                      <InputOTPSlot index={4} className="h-14 w-12 text-lg" />
                      <InputOTPSlot index={5} className="h-14 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar código'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-11 text-base"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Volver
                </Button>
              </div>

              <div className="text-center space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Código enviado a <span className="font-medium text-foreground">{email}</span>
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  ¿No recibiste el código? Reenviar
                </Button>
                <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border border-border/50">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    El código expira en 10 minutos
                  </p>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
