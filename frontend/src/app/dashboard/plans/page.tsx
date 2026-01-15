'use client';

import {
  Check,
  Crown,
  Sparkles,
  X,
  Zap
} from 'lucide-react';

const plans = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Perfeito para começar a organizar suas finanças.',
    highlight: false,
    features: [
      { name: 'Dashboard Completo', included: true },
      { name: 'Transações Ilimitadas', included: true },
      { name: 'Metas de Economia', included: true },
      { name: 'Simulador de Juros', included: true },
      { name: 'Cotações de Ações', included: true },
      { name: 'Kaptal Advisor (3 msgs/dia)', included: true },
      { name: 'Resumos Inteligentes (Volátil)', included: true },
      { name: 'Relatórios PDF/Excel', included: false },
      { name: 'Histórico de Resumos', included: false },
      { name: 'Suporte Prioritário', included: false },
    ]
  },
  {
    name: 'Premium',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Todas as ferramentas para dominar suas finanças.',
    highlight: true,
    features: [
      { name: 'Dashboard Completo', included: true },
      { name: 'Transações Ilimitadas', included: true },
      { name: 'Metas de Economia', included: true },
      { name: 'Simulador de Juros', included: true },
      { name: 'Cotações de Ações', included: true },
      { name: 'Kaptal Advisor Ilimitado', included: true },
      { name: 'Resumos Inteligentes', included: true },
      { name: 'Relatórios PDF/Excel', included: true },
      { name: 'Histórico de Resumos', included: true },
      { name: 'Suporte Prioritário', included: true },
    ]
  }
];

export default function PlansPage() {
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 mb-4">
          <Crown className="w-4 h-4" />
          <span className="text-sm font-bold">Escolha seu Plano</span>
        </div>
        <h1 className="text-3xl font-black mb-2">Planos Kaptal</h1>
        <p className="opacity-60 max-w-lg mx-auto">
          Escolha o plano ideal para suas necessidades. Comece grátis e faça upgrade quando quiser.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`glass-card p-8 relative overflow-hidden transition-all duration-300 ${
              plan.highlight 
                ? 'border-2 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                : ''
            }`}
          >
            {/* Popular Badge */}
            {plan.highlight && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Mais Popular
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-black mb-2">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-4xl font-black ${plan.highlight ? 'text-amber-500' : 'text-primary-500'}`}>
                  {plan.price}
                </span>
                <span className="opacity-40 font-bold">{plan.period}</span>
              </div>
              <p className="opacity-60 text-sm">{plan.description}</p>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {feature.included ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <X className="w-3 h-3 text-red-400" />
                    </div>
                  )}
                  <span className={`text-sm font-medium ${feature.included ? '' : 'opacity-40'}`}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button 
              className={`w-full py-4 rounded-xl font-bold text-center transition-all ${
                plan.highlight
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-primary-500/10 text-primary-500 hover:bg-primary-500/20'
              }`}
            >
              {plan.highlight ? (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Fazer Upgrade
                </span>
              ) : (
                'Plano Atual'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Note */}
      <div className="glass-card p-6 max-w-4xl mx-auto bg-primary-500/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Pagamentos em breve!</h3>
            <p className="opacity-60 text-sm">
              Estamos finalizando a integração com o sistema de pagamentos. 
              Por enquanto, aproveite todas as funcionalidades disponíveis gratuitamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
