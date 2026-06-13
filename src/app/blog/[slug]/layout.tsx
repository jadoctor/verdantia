import { Metadata } from 'next';
import pool from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    const [rows]: any = await pool.query(
      'SELECT blogtitulo, blogresumen, blogimagen, blogcontenido FROM blog WHERE blogslug = ? LIMIT 1',
      [slug]
    );

    if (rows && rows.length > 0) {
      const art = rows[0];
      let blogData: any = {};
      try {
        blogData = JSON.parse(art.blogcontenido);
      } catch (e) {}

      // URL de la imagen de portada
      const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || 'verdantia-494121.firebasestorage.app';
      const defaultHero = '/icon.png';
      let imageUrl = defaultHero;

      if (art.blogimagen) {
        imageUrl = art.blogimagen.startsWith('http') 
          ? art.blogimagen 
          : `https://storage.googleapis.com/${storageBucketName}/${art.blogimagen}`;
      } else if (blogData.hero_imagen) {
        imageUrl = blogData.hero_imagen.startsWith('http') || blogData.hero_imagen.startsWith('/')
          ? blogData.hero_imagen
          : `https://storage.googleapis.com/${storageBucketName}/${blogData.hero_imagen}`;
      }

      // Alt y Title SEO
      const altText = blogData.hero_imagen_alt || art.blogtitulo;

      return {
        title: `${art.blogtitulo} | Verdantia`,
        description: art.blogresumen || 'Artículo de interés agronómico en el blog de Verdantia.',
        openGraph: {
          title: art.blogtitulo,
          description: art.blogresumen || 'Artículo de interés agronómico en el blog de Verdantia.',
          type: 'article',
          images: [
            {
              url: imageUrl,
              alt: altText,
            }
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: art.blogtitulo,
          description: art.blogresumen || 'Artículo de interés agronómico en el blog de Verdantia.',
          images: [imageUrl],
        }
      };
    }
  } catch (error) {
    console.error('Error generating metadata for blog slug:', slug, error);
  }

  return {
    title: 'Blog | Verdantia',
    description: 'Aprende sobre agricultura ecológica y huerto urbano en el blog de Verdantia.'
  };
}

export default function BlogArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
