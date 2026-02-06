import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OnboardingInviteEmailProps {
  userName?: string;
  onboardingUrl?: string;
  expiresInMinutes?: number;
}

export const OnboardingInviteEmail = ({
  userName = "Socio",
  onboardingUrl = "",
  expiresInMinutes = 10,
}: OnboardingInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Invitación para completar tu perfil de socio en Crece tu Negocio
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Main content */}
          <Section style={content}>
            <Heading style={h1}>¡Completa tu Perfil de Socio!</Heading>
            <Heading style={h2}>Te damos la bienvenida a Crece tu Negocio</Heading>

            <Text style={paragraph}>Hola {userName},</Text>

            <Text style={paragraph}>
              Has sido invitado a completar tu perfil de socio en{" "}
              <strong>Crece tu Negocio</strong>. Este proceso te permitirá configurar
              tu cuenta y comenzar a disfrutar de todos los beneficios de la
              plataforma.
            </Text>

            <Text style={paragraph}>
              Haz clic en el botón a continuación para comenzar con tu proceso
              de onboarding:
            </Text>

            <Section style={buttonContainer}>
              <Link href={onboardingUrl} style={button}>
                Completar mi Perfil
              </Link>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⏰ <strong>Importante:</strong> Este enlace es válido por{" "}
                <strong>{expiresInMinutes} minutos</strong>. Si expira, deberás
                solicitar uno nuevo.
              </Text>
            </Section>

            <Text style={paragraph}>
              Si tienes alguna pregunta durante el proceso, no dudes en
              contactarnos. Estamos aquí para ayudarte.
            </Text>

            <Text style={signature}>
              ¡Bienvenido al equipo!
              <br />
              <strong>Equipo Crece tu Negocio</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Crece tu Negocio. Todos los derechos
              reservados.
            </Text>
            <Text style={footerText}>
              Si no esperabas este correo, puedes ignorarlo de forma segura.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OnboardingInviteEmail;

// Styles - Using platform colors from globals.css
const main = {
  backgroundColor: "#fafafa",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const content = {
  padding: "40px 30px",
  backgroundColor: "#ffffff",
};

const h1 = {
  color: "#212121", // primary dark
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.3",
  marginBottom: "8px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#525252", // muted-foreground
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "1.4",
  marginBottom: "30px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#212121",
  fontSize: "16px",
  lineHeight: "1.6",
  marginBottom: "20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "30px",
  marginBottom: "30px",
};

const button = {
  backgroundColor: "#212121", // primary dark
  borderRadius: "10px",
  color: "#fafafa",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "10px",
  padding: "16px",
  marginTop: "20px",
  marginBottom: "20px",
};

const warningText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
};

const signature = {
  color: "#212121",
  fontSize: "16px",
  lineHeight: "1.6",
  marginTop: "30px",
  marginBottom: "0",
};

const footer = {
  backgroundColor: "#fafafa",
  padding: "30px 20px",
  borderTop: "1px solid #e5e5e5",
  borderRadius: "0 0 10px 10px",
  marginTop: "20px",
};

const footerText = {
  color: "#737373", // muted-foreground
  fontSize: "13px",
  lineHeight: "1.5",
  textAlign: "center" as const,
  marginBottom: "8px",
};

const footerLinks = {
  textAlign: "center" as const,
  marginTop: "16px",
};

const link = {
  color: "#212121",
  textDecoration: "underline",
  fontSize: "13px",
};
