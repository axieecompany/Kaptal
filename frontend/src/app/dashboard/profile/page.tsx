'use client';

import { useAuth } from '@/lib/auth';
import {
    Calendar,
    Mail,
    Shield,
    User
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Não disponível';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="opacity-60">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-8 text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
              <span className="text-4xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            <h2 className="text-xl font-bold mb-1">{user?.name || 'Usuário'}</h2>
            <p className="opacity-60 text-sm mb-6">{user?.email}</p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Conta Ativa
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              Informações Básicas
            </h3>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-40 uppercase tracking-wider">Nome Completo</label>
                <div className="input-field bg-current/[0.02]">
                  {user?.name || 'Não informado'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-40 uppercase tracking-wider">Email</label>
                <div className="input-field bg-current/[0.02] flex items-center gap-2">
                  <Mail className="w-4 h-4 opacity-40" />
                  {user?.email || 'Não informado'}
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-500" />
              Segurança da Conta
            </h3>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-40 uppercase tracking-wider">Status da Conta</label>
                <div className="input-field bg-current/[0.02] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Verificada
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-40 uppercase tracking-wider">Autenticação 2FA</label>
                <div className="input-field bg-current/[0.02] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Ativada por Email
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Histórico da Conta
            </h3>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-40 uppercase tracking-wider">Membro Desde</label>
                <div className="input-field bg-current/[0.02]">
                  {formatDate(user?.createdAt)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-40 uppercase tracking-wider">Última Atualização</label>
                <div className="input-field bg-current/[0.02]">
                  {formatDate(user?.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div className="glass-card p-6 border-l-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Plano Atual</h3>
                <p className="opacity-60 text-sm">Você está utilizando o plano gratuito</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 font-bold">
                FREE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
