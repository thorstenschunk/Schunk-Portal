import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'SCHUNK PORTAL',
  description: 'Betriebsportal der Design Tischlerei Schunk',
  robots: { index: false, follow: false },
  icons: { icon: '/logo-original.jpg', shortcut: '/logo-original.jpg', apple: '/logo-original.jpg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body><AuthProvider><AppShell>{children}</AppShell></AuthProvider></body></html>;
}
