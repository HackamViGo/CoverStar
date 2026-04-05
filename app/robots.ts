import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? 'https://coverstar.pro';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/unauthorized', '/forbidden'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
