import { AuthProvider } from '@/lib/auth';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaptal - Finanças Pessoais',
  description: 'Controle suas finanças de forma inteligente com o Kaptal. Acompanhe gastos, investimentos e muito mais.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
