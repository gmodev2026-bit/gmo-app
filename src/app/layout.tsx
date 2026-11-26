import type { Metadata } from 'next';
import './globals.css';
import { fontSans, fontMono } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Find local home service providers`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_TAGLINE,
  keywords: [
    'local home services',
    'home repairs',
    'Johannesburg service providers',
    'Pretoria service providers'
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Find local home service providers`,
    description: SITE_TAGLINE
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Find local home service providers`,
    description: SITE_TAGLINE
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en-ZA' suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
