import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  nombre: string;
  email: string;
  resetLink: string;
}

export const PasswordResetEmail = ({
  nombre,
  email,
  resetLink,
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Restablece tu contraseña de Verdantia 🔑</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>🌱 Verdantia</Text>
            <Heading style={heading}>Recuperación de contraseña</Heading>
          </Section>

          <Section style={bodySection}>
            <Text style={text}>Hola {nombre || 'Agricultor'},</Text>
            <Text style={text}>
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Verdantia — Cultiva & Comparte Semillas</strong>, asociada al correo electrónico <strong>{email}</strong>.
            </Text>

            <Text style={text}>
              Haz clic en el siguiente botón para crear una nueva contraseña segura. Serás redirigido a nuestra plataforma para establecerla:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetLink}>
                🔑 Restablecer mi contraseña
              </Button>
            </Section>

            <Text style={smallText}>
              Este enlace caduca en <strong>1 hora</strong> por seguridad. Si no has solicitado este cambio, puedes ignorar este correo de forma segura — tu contraseña actual seguirá activa.
            </Text>

            <Hr style={hr} />

            <Text style={infoBox}>
              <strong>¿Qué es Verdantia?</strong><br />
              Verdantia es una plataforma comunitaria para gestionar tu huerto, intercambiar semillas y conectar con otros agricultores urbanos. Tu cuenta te da acceso al seguimiento de cultivos, alertas meteorológicas locales y la comunidad de semilleros.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Si no has creado una cuenta en Verdantia o no has solicitado este cambio, ignora este correo.
              <br /><br />
              © {new Date().getFullYear()} Verdantia — Cultiva & Comparte Semillas · verdantia.life
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

// --- Estilos en línea para máxima compatibilidad con clientes de correo ---

const main = {
  backgroundColor: '#f4f6f9',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '40px auto',
  width: '100%',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#0056b3',
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
  padding: '0',
};

const heading = {
  color: 'rgba(255,255,255,0.9)',
  fontSize: '18px',
  fontWeight: 'normal' as const,
  margin: '0',
  padding: '0',
};

const bodySection = {
  padding: '40px',
};

const text = {
  color: '#1e293b',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '20px',
};

const smallText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0056b3',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const infoBox = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '22px',
  backgroundColor: '#f0f7ff',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #e0f2fe',
  marginBottom: '20px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
};
