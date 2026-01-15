import { ArrowRight, BarChart3, PieChart, Shield, TrendingUp, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-0 border-b border-current/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Kaptal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary">
              Entrar
            </Link>
            <Link href="/register" className="btn-primary">
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Floating Elements */}
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary-500/30 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute top-60 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-[120px] animate-pulse-slow animation-delay-200" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-current/5 border border-current/10 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm opacity-70">Controle total das suas finanças</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Suas finanças
              <br />
              <span className="gradient-text">em um só lugar</span>
            </h1>
            
            <p className="text-xl opacity-60 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100">
              Acompanhe seus gastos, investimentos e ações da bolsa. 
              Tudo integrado para você tomar as melhores decisões financeiras.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-200">
              <Link href="/register" className="btn-primary flex items-center justify-center gap-2 text-lg">
                Criar conta gratuita
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-secondary flex items-center justify-center gap-2 text-lg">
                Já tenho uma conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="opacity-60 max-w-xl mx-auto">
              Ferramentas poderosas para controlar e fazer crescer seu patrimônio
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-card p-8 hover:bg-current/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Controle de Gastos</h3>
              <p className="opacity-60">
                Registre e categorize despesas. Defina orçamentos por categoria e acompanhe seu consumo mensal.
              </p>
            </div>

            {/* Feature 2 - Portfolio */}
            <div className="glass-card p-8 hover:bg-current/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Carteira de Investimentos</h3>
              <p className="opacity-60">
                Cadastre suas ações e FIIs. Cotações em tempo real da B3. Calcule lucro, preço médio e valor atual.
              </p>
            </div>

            {/* Feature 3 - Simulator */}
            <div className="glass-card p-8 hover:bg-current/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Simulador de Juros Compostos</h3>
              <p className="opacity-60">
                Simule seus investimentos e veja quanto terá no futuro com aportes mensais e juros compostos.
              </p>
            </div>

            {/* Feature 4 - Dividends */}
            <div className="glass-card p-8 hover:bg-current/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <PieChart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Controle de Proventos</h3>
              <p className="opacity-60">
                Registre dividendos, JCP e rendimentos. Gráficos de proventos por tipo e média mensal.
              </p>
            </div>

            {/* Feature 5 - Savings Goals */}
            <div className="glass-card p-8 hover:bg-current/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Metas de Economia</h3>
              <p className="opacity-60">
                Crie metas de poupança, acompanhe o progresso e saiba quanto precisa guardar por mês.
              </p>
            </div>

            {/* Feature 6 - Security */}
            <div className="glass-card p-8 hover:bg-current/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Segurança Total</h3>
              <p className="opacity-60">
                Dados criptografados, verificação por email e proteção completa das suas informações.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 relative" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 mb-4">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Planos</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o plano ideal
            </h2>
            <p className="opacity-60 max-w-xl mx-auto">
              Comece gratuitamente e faça upgrade quando precisar de mais recursos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="glass-card p-8 hover:scale-[1.02] transition-transform duration-300">
              <h3 className="text-2xl font-bold mb-2">Gratuito</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-primary-500">R$ 0</span>
                <span className="opacity-40">/mês</span>
              </div>
              <p className="opacity-60 text-sm mb-6">Perfeito para começar a organizar.</p>
              
              <ul className="space-y-3 mb-8">
                {['Dashboard Completo', 'Transações Ilimitadas', 'Metas de Economia', 'Simulador de Juros', 'Cotações de Ações'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-500 text-[10px]">✓</span>
                    </div>
                    {f}
                  </li>
                ))}
                {['Relatórios PDF/Excel', 'Histórico de Resumos', 'Suporte Prioritário'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm opacity-40">
                    <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                      <span className="text-red-400 text-[10px]">✕</span>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              
              <Link href="/register" className="btn-secondary w-full text-center block">
                Começar Grátis
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="glass-card p-8 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10 relative hover:scale-[1.02] transition-transform duration-300 overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                Popular
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-amber-500">R$ 29,90</span>
                <span className="opacity-40">/mês</span>
              </div>
              <p className="opacity-60 text-sm mb-6">Todas as ferramentas para dominar suas finanças.</p>
              
              <ul className="space-y-3 mb-8">
                {['Dashboard Completo', 'Transações Ilimitadas', 'Metas de Economia', 'Kaptal Advisor Ilimitado', 'Relatórios PDF/Excel', 'Histórico de Resumos', 'Suporte Prioritário'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-500 text-[10px]">✓</span>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              
              <Link href="/register" className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-center block transition-all shadow-lg shadow-amber-500/30">
                Fazer Upgrade
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-500/30 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/30 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comece a controlar suas finanças hoje
            </h2>
            <p className="opacity-60 mb-8 max-w-xl mx-auto">
              Cadastre-se gratuitamente e tenha acesso a todas as ferramentas para organizar sua vida financeira.
            </p>
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg">
              Criar minha conta
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-current/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold opacity-80">Kaptal</span>
          </div>
          <p className="opacity-40 text-sm">
            © {new Date().getFullYear()} Kaptal. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
