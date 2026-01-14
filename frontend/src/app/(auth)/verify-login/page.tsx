'use client';

import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CheckCircle, Loader2, RefreshCw, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function VerifyLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verifyEmail');
    if (!storedEmail) {
      router.push('/login');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (newCode.every((digit) => digit) && value) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (codeString: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyLogin({ email, code: codeString });
      
      if (response.data?.token && response.data?.user) {
        login(response.data.token, response.data.user);
        setSuccess(true);
        sessionStorage.removeItem('verifyEmail');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Código inválido. Tente novamente.');
      }
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError('');

    try {
      await authApi.resendCode({ email, type: 'LOGIN_VERIFICATION' });
      setCountdown(60);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao reenviar código.');
      }
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card p-8 animate-fade-in text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Login realizado!</h1>
        <p className="opacity-60 mb-4">
          Redirecionando para o dashboard...
        </p>
        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Verificação de segurança</h1>
        <p className="opacity-60">
          Enviamos um código de 6 dígitos para
        </p>
        <p className="text-primary-500 font-medium">{email}</p>
      </div>

      {/* Code Input */}
      <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="code-input"
            disabled={isLoading}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm text-center mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 opacity-60 mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          Verificando...
        </div>
      )}

      {/* Resend */}
      <div className="text-center">
        <p className="opacity-60 text-sm mb-2">Não recebeu o código?</p>
        <button
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className="text-primary-500 hover:text-primary-600 font-medium flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
        </button>
      </div>

      <div className="mt-8 pt-6 text-center">
        <Link href="/login" className="opacity-60 hover:opacity-100 text-sm">
          ← Voltar para o login
        </Link>
      </div>
    </div>
  );
}
