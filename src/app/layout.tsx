import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const metadata: Metadata = { title: 'FlowTrack', description: 'Project management tool' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`}>{children}</body>
    </html>
  );
}
