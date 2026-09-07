import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { Footer } from '@/components/layout/footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentIPO',
  description: 'Fundraising where the investor is an agent.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
