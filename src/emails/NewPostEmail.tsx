import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface NewPostEmailProps {
  nombre: string;
  blogTitulo: string;
  blogResumen: string;
  blogUrl: string;
  blogImagenUrl: string;
  unsubscribeUrl?: string;
  planGratuito?: boolean;
}

export const NewPostEmail = ({
  nombre = 'Lector',
  blogTitulo = 'Nuevo Artículo en Verdantia',
  blogResumen = 'Descubre las últimas novedades sobre el cuidado de tu huerto.',
  blogUrl = 'https://verdantia.life',
  blogImagenUrl = '',
  unsubscribeUrl,
  planGratuito = true,
}: NewPostEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{blogTitulo}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`https://verdantia.life/logo-verdantia.jpg`}
              width="80"
              height="80"
              alt="Verdantia"
              style={logo}
            />
          </Section>
          <Heading style={h1}>🌱 Nuevo en Verdantia</Heading>
          <Text style={text}>
            Hola, <strong>{nombre}</strong>:
          </Text>
          <Text style={text}>
            Acabamos de publicar un nuevo artículo que creemos que te encantará:
          </Text>

          <Section style={card}>
            {blogImagenUrl && (
              <Img
                src={blogImagenUrl}
                width="100%"
                height="auto"
                alt="Blog cover"
                style={image}
              />
            )}
            <div style={cardBody}>
              <Heading as="h2" style={h2}>
                {blogTitulo}
              </Heading>
              <Text style={summaryText}>
                {blogResumen}
              </Text>
              <Section style={btnContainer}>
                <Link href={blogUrl} style={button}>
                  Leer Artículo Completo
                </Link>
              </Section>
            </div>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            {planGratuito ? (
              <>
                Como usuario del <strong>Plan Gratuito</strong>, recibir el Boletín Agrícola es necesario para mantener tu cuenta activa. 
                <br />
                <br />
                <Link href={unsubscribeUrl || '#'} style={{ color: '#ef4444', textDecoration: 'underline', fontWeight: 'bold', fontSize: '14px' }}>
                  Deseo dejar de recibir correos (Pausar mi cuenta en 1 clic)
                </Link>
                <br />
                <br />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Si cambias de opinión o quieres controlar qué correos recibes manteniendo el acceso a tu huerto,{' '}
                  <Link href={`${blogUrl.split('/blog')[0]}/login?callbackUrl=/dashboard/perfil%23planes`} style={{ color: '#10b981', textDecoration: 'underline' }}>
                    mejora a un Plan Premium aquí
                  </Link>.
                </span>
              </>
            ) : (
              <>
                Recibes este correo porque estás suscrito al Boletín Agrícola de Verdantia.
                <br />
                <br />
                {unsubscribeUrl && (
                  <>
                    <Link href={unsubscribeUrl} style={{ color: '#ef4444', textDecoration: 'underline', fontWeight: 'bold', fontSize: '14px' }}>
                      👉 Darme de baja de este boletín en 1 clic
                    </Link>
                    <br />
                    <br />
                  </>
                )}
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Para cambiar otras opciones o preferencias,{' '}
                  <Link href={`${blogUrl.split('/blog')[0]}/login?callbackUrl=/dashboard/perfil%23comunicaciones`} style={{ color: '#10b981', textDecoration: 'underline' }}>
                    inicia sesión en tu perfil
                  </Link>.
                </span>
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f8fafc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  padding: '24px 32px 48px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
};

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const logo = {
  margin: '0 auto',
  borderRadius: '50%',
};

const h1 = {
  color: '#0f766e',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const card = {
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
  margin: '24px 0',
};

const image = {
  width: '100%',
  maxHeight: '300px',
  objectFit: 'cover' as const,
};

const cardBody = {
  padding: '24px',
  backgroundColor: '#ffffff',
};

const h2 = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const summaryText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 24px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0 24px',
};

const footer = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '20px',
  textAlign: 'center' as const,
};

const linkText = {
  color: '#10b981',
  textDecoration: 'underline',
};

const unsubscribeLink = {
  color: '#94a3b8',
  textDecoration: 'underline',
  fontSize: '12px',
};

export default NewPostEmail;
