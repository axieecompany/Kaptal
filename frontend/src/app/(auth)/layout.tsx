import { Wallet } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-accent-400/20 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-bold text-white">Kaptal</span>
          </Link>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Controle total das
            <br />
            suas finanças
          </h1>
          
          <p className="text-white/70 text-lg max-w-md">
            Acompanhe gastos, investimentos e ações da bolsa em um único lugar. 
            Tome decisões financeiras inteligentes.
          </p>

          <div className="mt-12 flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-white/60 text-sm">Gratuito</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">Seguro</p>
              <p className="text-white/60 text-sm">Verificação 2FA</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">Fácil</p>
              <p className="text-white/60 text-sm">De usar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Kaptal</span>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
