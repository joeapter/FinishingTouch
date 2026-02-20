import type { Metadata } from 'next';
import { Space_Grotesk, Noto_Serif } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { RootShell } from '@/components/layout/root-shell';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const notoSerif = Noto_Serif({
  variable: '--font-noto-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Finishing Touch | Turnover Painting',
  description:
    'Finishing Touch provides professional turnover painting for rental apartments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${notoSerif.variable} antialiased`}>
        <Providers>
          <RootShell>{children}</RootShell>
        </Providers>
      </body>
    </html>
  );
}
