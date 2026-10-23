import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import './globals.css';
import IntroGlobe from '../components/IntroGlobe';
import { INTRO_GATE_SCRIPT } from '../components/intro/introGate';

export const metadata: Metadata = {
  title: 'Andy Wang',
  description: "Andy Wang's Portfolio",
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
      </head>
      <body>
          <IntroGlobe />
          <main>
            {children}
            <Analytics />
          </main>
      </body>
    </html>
  );
}
