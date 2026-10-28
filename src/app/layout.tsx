import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VisiOS — Visual Learning Operating System',
  description: 'Futuristic visual learning operating system for students',
};

import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased overflow-hidden select-none bg-[#090d16] text-slate-100" suppressHydrationWarning>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

