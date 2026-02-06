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

interface BlogReviewStatusEmailProps {
  userName?: string;
  blogTitle?: string;
  reviewStatus?: "approved" | "rejected" | "pending_review" | "published";
  reason?: string;
  blogUrl?: string;
}

const getStatusInfo = (status: string) => {
  const statusMap = {
    approved: {
      label: "Aprobado",
      emoji: "✅",
      color: "#10b981",
      message: "¡Excelente noticia! Tu artículo ha sido aprobado y ya puedes publicarlo.",
    },
    rejected: {
      label: "Rechazado",
      emoji: "❌",
      color: "#ef4444",
      message: "Tu artículo ha sido rechazado. Por favor, revisa los comentarios y realiza las correcciones necesarias.",
    },
    pending_review: {
      label: "Pendiente de Revisión",
      emoji: "🔍",
      color: "#f59e0b",
      message: "Tu artículo está en revisión. Te notificaremos cuando sea evaluado.",
    },
    published: {
      label: "Publicado",
      emoji: "🎉",
      color: "#10b981",
      message: "¡Tu artículo ha sido publicado exitosamente!",
    },
  };

  return statusMap[status as keyof typeof statusMap] || statusMap.pending_review;
};

export const BlogReviewStatusEmail = ({
  userName = "Socio",
  blogTitle = "Tu artículo",
  reviewStatus = "pending_review",
  reason,
  blogUrl = "",
}: BlogReviewStatusEmailProps) => {
  const statusInfo = getStatusInfo(reviewStatus);

  return (
    <Html>
      <Head />
      <Preview>
        Actualización del estado de tu artículo: {blogTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Main content */}
          <Section style={content}>
            <Heading style={h1}>
              {statusInfo.emoji} Estado de tu Artículo
            </Heading>

            <Text style={paragraph}>Hola {userName},</Text>

            <Text style={paragraph}>
              Te informamos que el estado de tu artículo ha cambiado:
            </Text>

            <Section style={blogInfoBox}>
              <Text style={blogTitleText}>
                <strong>{blogTitle}</strong>
              </Text>
              <Section style={{ ...statusBadge, backgroundColor: statusInfo.color }}>
                <Text style={statusText}>
                  {statusInfo.label}
                </Text>
              </Section>
            </Section>

            <Text style={paragraph}>
              {statusInfo.message}
            </Text>

            {reason && (
              <Section style={reasonBox}>
                <Text style={reasonTitle}>
                  <strong>Comentarios del administrador:</strong>
                </Text>
                <Text style={reasonText}>
                  {reason}
                </Text>
              </Section>
            )}

            {reviewStatus === "approved" && (
              <Text style={paragraph}>
                Ahora puedes publicar tu artículo para que esté visible públicamente.
                Accede a tu panel de contenido para publicarlo.
              </Text>
            )}

            {reviewStatus === "rejected" && (
              <Text style={paragraph}>
                Puedes editar tu artículo y volver a enviarlo para revisión una vez
                que hayas realizado las correcciones sugeridas.
              </Text>
            )}

            {blogUrl && (
              <Section style={buttonContainer}>
                <Link href={blogUrl} style={button}>
                  Ver mi artículo
                </Link>
              </Section>
            )}

            <Text style={signature}>
              Saludos,
              <br />
              <strong>Equipo Editorial de Crece tu Negocio</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Crece tu Negocio. Todos los derechos
              reservados.
            </Text>
            <Text style={footerText}>
              Este es un correo automático, por favor no respondas a este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BlogReviewStatusEmail;

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
  borderRadius: "10px",
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
};

const blogInfoBox = {
  backgroundColor: "#f5f5f5",
  borderRadius: "10px",
  padding: "24px",
  marginTop: "20px",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const blogTitleText = {
  color: "#212121",
  fontSize: "18px",
  lineHeight: "1.5",
  marginBottom: "12px",
  display: "block",
};

const statusBadge = {
  display: "inline-block",
  borderRadius: "20px",
  padding: "8px 16px",
  marginTop: "8px",
};

const statusText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
  textAlign: "center" as const,
};

const reasonBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "10px",
  padding: "20px",
  marginTop: "20px",
  marginBottom: "20px",
};

const reasonTitle = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "8px",
  display: "block",
};

const reasonText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
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
