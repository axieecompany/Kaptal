'use client';

import { Wallet } from 'lucide-react';

export default function PatrimonyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Patrimônio</h1>
        <p className="text-white/60">Acompanhe seus investimentos e patrimônio</p>
      </div>

      {/* Coming Soon */}
      <div className="glass-card p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Em breve!
        </h2>
        <p className="text-white/60 max-w-md mx-auto">
          Estamos trabalhando nas funcionalidades de acompanhamento de investimentos, 
          registro de ações e integração com a bolsa. Fique ligado!
        </p>
      </div>
    </div>
  );
}
