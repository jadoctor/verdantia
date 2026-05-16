import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  nombre: string;
  verificationLink: string;
  sexo?: string | null;
}

export const VerificationEmail = ({
  nombre,
  verificationLink,
  sexo,
}: VerificationEmailProps) => {
  let saludo = '¡Te damos la bienvenida a Verdantia! 🌱';
  if (sexo === 'Hombre') saludo = '¡Bienvenido a Verdantia! 🌱';
  if (sexo === 'Mujer') saludo = '¡Bienvenida a Verdantia! 🌱';
  const logoUrl = 'https://verdantia.life/logo-verdantia.jpg'; // Usaremos URL absoluta cuando esté en producción

  return (
    <Html>
      <Head />
      <Preview>Verifica tu correo electrónico para unirte a Verdantia</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={logoUrl}
              width="150"
              height="auto"
              alt="Verdantia Logo"
              style={logo}
            />
            <Heading style={heading}>{saludo}</Heading>
          </Section>

          <Section style={bodySection}>
            <Text style={text}>Hola {nombre},</Text>
            <Text style={text}>
              Has solicitado verificar esta dirección de correo electrónico para proteger tu cuenta y desbloquear todas las funciones de tu perfil en Verdantia.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationLink}>
                Verificar mi correo y volver al perfil
              </Button>
            </Section>

            <Text style={text}>
              Si tú no has solicitado esta verificación, puedes ignorar este correo de forma segura.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Si no has creado una cuenta en Verdantia, por favor ignora este correo.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

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
  backgroundColor: '#0056b3', // Utilizamos el storm-primary de CSS global
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const heading = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const logo = {
  margin: '0 auto 20px auto',
  display: 'block',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0056b3', // storm-primary (azul corporativo)
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const link = {
  color: '#0056b3',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
};

const footer = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '20px',
};
