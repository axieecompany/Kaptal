'use client';

import { useAuth } from '@/lib/auth';
import {
    Calendar,
    Camera,
    Check,
    Loader2,
    LogOut,
    Mail,
    Pencil,
    Shield,
    User,
    X
} from 'lucide-react';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState((user as any)?.avatarUrl || '');

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Não disponível';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditAvatarUrl((user as any)?.avatarUrl || '');
    setError('');
    setSuccess('');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          avatarUrl: editAvatarUrl || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar perfil');
      }

      setSuccess('Perfil atualizado com sucesso!');
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
      
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
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
            {/* Avatar with Upload Overlay */}
            <div className="relative w-24 h-24 mx-auto mb-6 group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-500/30 overflow-hidden">
                {(user as any)?.avatarUrl ? (
                  <img src={(user as any).avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {/* Upload Button Overlay */}
              <button 
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                onClick={openEditModal}
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>

            <h2 className="text-xl font-bold mb-1">{user?.name || 'Usuário'}</h2>
            <p className="opacity-60 text-sm mb-6">{user?.email}</p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Conta Ativa
            </div>

            {/* Quick Stats */}
            <div className="mt-8 pt-6 border-t border-current/10">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-primary-500">32</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Transações</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-accent-500">3</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Metas Ativas</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button 
                onClick={openEditModal}
                className="w-full py-3 px-4 rounded-xl bg-primary-500/10 text-primary-500 font-bold text-sm hover:bg-primary-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar Perfil
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Editar Perfil</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Avatar Preview */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center overflow-hidden">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {editName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="input-label">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Email (display only) */}
              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  disabled
                  className="input-field opacity-50 cursor-not-allowed"
                  placeholder="seu@email.com"
                />
                <p className="text-xs opacity-40 mt-1">O email não pode ser alterado por segurança.</p>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="input-label">URL da Foto de Perfil</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://exemplo.com/sua-foto.jpg"
                />
                <p className="text-xs opacity-40 mt-1">Cole a URL de uma imagem existente na web.</p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                  <X className="w-4 h-4" /> {error}
                </p>
              )}
              {success && (
                <p className="text-emerald-500 text-sm font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> {success}
                </p>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSaveProfile}
                disabled={isLoading || !editName.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
