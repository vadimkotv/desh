import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthGate } from '@/components/auth/auth-gate';
import { SessionBoundary } from '@/components/auth/session-boundary';
import { TopNav } from '@/components/layout/top-nav';
import { Footer } from '@/components/layout/footer';
import { inter, jetbrains } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentIPO · Command center',
  description: 'Fundraising where the investor is an agent bound by a human mandate.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SessionBoundary>
          <TopNav />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6">
            <AuthGate>{children}</AuthGate>
          </main>
          <Footer />
        </SessionBoundary>
      </body>
    </html>
  );
}
