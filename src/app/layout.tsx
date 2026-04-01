import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import './globals.css';

export const metadata: Metadata = {
  title: 'Andy Wang',
  description: "Andy Wang's Portfolio",
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
          <main>
            {children}
            <Analytics />
          </main>
      </body>
    </html>
  );
}
