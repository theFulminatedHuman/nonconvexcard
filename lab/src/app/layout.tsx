import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeScript } from '@/components/layout/theme-script';
import { BASE_PATH } from '@/lib/base-path';
import { buildFieldNav } from '@/lib/nav';
import { SITE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.short}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: 'AI Mathematics Research Lab' }],
  keywords: [
    'high-dimensional probability',
    'concentration inequalities',
    'convex optimization',
    'stochastic gradient descent',
    'statistical learning theory',
    'transformers',
    'retrieval-augmented generation',
    'mathematics of machine learning',
  ],
  openGraph: { title: SITE.name, description: SITE.tagline, type: 'website' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfb' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0e12' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fields = buildFieldNav();
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AppShell fields={fields} basePath={BASE_PATH}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
