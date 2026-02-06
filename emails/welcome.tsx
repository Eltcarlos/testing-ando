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

interface WelcomeEmailProps {
  userName?: string;
  loginUrl?: string;
}

export const WelcomeEmail = ({
  userName = "Usuario",
  loginUrl = "",
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        ¡Bienvenido a Crece tu Negocio! Tu cuenta ha sido creada exitosamente
      </Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h1}>¡Bienvenido a Crece tu Negocio!</Heading>
            <Heading style={h2}>Tu cuenta ha sido creada exitosamente</Heading>

            <Text style={paragraph}>Hola {userName},</Text>

            <Text style={paragraph}>
              ¡Bienvenido a <strong>Crece tu Negocio</strong>! Tu cuenta ha sido creada
              exitosamente y ya puedes comenzar a utilizar la plataforma.
            </Text>

            <Text style={paragraph}>
              Para acceder a tu cuenta, haz clic en el siguiente enlace:
            </Text>

            <Section style={buttonContainer}>
              <Link href={loginUrl} style={button}>
                Iniciar Sesión
              </Link>
            </Section>

            <Text style={paragraph}>
              Si tienes alguna pregunta o necesitas ayuda, no dudes en
              contactarnos.
            </Text>

            <Text style={signature}>
              Saludos,
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
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
