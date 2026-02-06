import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OtpEmailProps {
  otp?: string;
}

export const OtpEmail = ({
  otp = "123456",
}: OtpEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Tu código de verificación de Crece tu Negocio: {otp}
      </Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h1}>Código de Verificación</Heading>

            <Text style={paragraph}>
              Has solicitado un código de verificación para acceder a tu cuenta
              de Crece tu Negocio.
            </Text>

            <Text style={paragraph}>
              Tu código de verificación es:
            </Text>

            {/* OTP Code Display */}
            <Section style={otpContainer}>
              <Text style={otpCode}>{otp}</Text>
            </Section>

            <Text style={paragraph}>
              Este código es válido por <strong>10 minutos</strong>.
            </Text>

            <Text style={warningText}>
              Si no solicitaste este código, puedes ignorar este mensaje de
              forma segura.
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
            <Text style={footerText}>
              Este es un correo automático, por favor no respondas a este
              mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OtpEmail;

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
  marginBottom: "30px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#212121",
  fontSize: "16px",
  lineHeight: "1.6",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const otpContainer = {
  backgroundColor: "#fafafa",
  border: "2px dashed #525252",
  borderRadius: "10px",
  padding: "30px 20px",
  textAlign: "center" as const,
  marginTop: "20px",
  marginBottom: "20px",
};

const otpCode = {
  fontSize: "48px",
  fontWeight: "700",
  color: "#212121", // primary dark
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
};

const warningText = {
  color: "#737373", // muted-foreground
  fontSize: "14px",
  lineHeight: "1.6",
  marginTop: "30px",
  marginBottom: "0",
  textAlign: "center" as const,
  fontStyle: "italic",
};

const signature = {
  color: "#212121",
  fontSize: "16px",
  lineHeight: "1.6",
  marginTop: "30px",
  marginBottom: "0",
  textAlign: "center" as const,
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
