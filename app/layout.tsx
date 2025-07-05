import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cannes AirAgent',
  description: 'Interactive AI support with voice interface and Web3 integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
} 