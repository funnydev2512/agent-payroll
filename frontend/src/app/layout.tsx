import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paychef — Crypto Payroll Agent',
  description: 'AI Agent Wallet for automated USDC payroll on Base Sepolia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
