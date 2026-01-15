'use client';

import {
    ArrowLeftRight,
    Calculator,
    ChevronLeft,
    ChevronRight,
    FileText,
    LayoutDashboard,
    PiggyBank,
    Scale,
    Sparkles,
    Target,
    TrendingUp,
    Wallet
} from 'lucide-react';
import { useState } from 'react';

const poupadorSlides = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Sua central de controle financeiro.',
    details: [
      'Veja o resumo do seu saldo atual, receitas e despesas do mês.',
      'Gráfico de evolução do saldo mostra seu progresso ao longo do tempo.',
      'Cards de resumo exibem os totais de entradas, saídas e saldo.',
      'Acesso rápido às últimas transações registradas.',
    ]
  },
  {
    title: 'Transações',
    icon: ArrowLeftRight,
    description: 'Registre e acompanhe todas as suas movimentações.',
    details: [
      'Adicione receitas (salário, freelances, vendas) e despesas.',
      'Categorize cada transação para entender onde seu dinheiro vai.',
      'Filtre por período, tipo ou busque por descrição.',
      'Edite ou exclua transações a qualquer momento.',
    ]
  },
  {
    title: 'Gastos',
    icon: Target,
    description: 'Defina limites por categoria e controle seu orçamento.',
    details: [
      'Defina quanto você quer gastar em cada categoria (Alimentação, Transporte, etc.).',
      'Veja o gráfico de pizza mostrando a distribuição dos seus gastos.',
      'Compare o gasto real com o planejado para cada categoria.',
      'Receba alertas quando estiver perto de estourar o limite.',
    ]
  },
  {
    title: 'Resumos Inteligentes',
    icon: Scale,
    description: 'Importe extratos bancários e gere análises instantâneas.',
    details: [
      'Faça upload de arquivos CSV do seu banco (Nubank, Inter, etc.).',
      'Veja gráficos de Receitas, Despesas e Volume Financeiro semanal.',
      'A IA categoriza automaticamente suas transações.',
      'No plano Pro, salve o histórico de cada mês para consulta futura.',
    ]
  },
  {
    title: 'Kaptal Advisor',
    icon: Sparkles,
    description: 'Seu consultor financeiro com inteligência artificial.',
    details: [
      'Converse com a IA sobre suas finanças em tempo real.',
      'Receba dicas personalizadas de economia baseadas nos seus gastos.',
      'A IA conhece suas metas, saldo e histórico de transações.',
      'Pergunte quanto pode gastar, simule cenários e tire dúvidas.',
    ]
  },
  {
    title: 'Relatórios',
    icon: FileText,
    description: 'Exporte seus dados em PDF e Excel profissionais.',
    details: [
      'Gere relatórios em PDF com gráficos e resumos visuais.',
      'Exporte listas de transações em Excel para análise detalhada.',
      'Filtros aplicados são refletidos nos relatórios gerados.',
      'Ideal para controle pessoal, contabilidade ou declaração de IR.',
    ]
  },
  {
    title: 'Metas de Economia',
    icon: PiggyBank,
    description: 'Crie objetivos financeiros e acompanhe seu progresso.',
    details: [
      'Crie metas como "Reserva de Emergência", "Viagem", "Carro Novo".',
      'Defina o valor alvo e acompanhe quanto já economizou.',
      'Faça depósitos parciais e veja a barra de progresso subir.',
      'Comemore quando atingir 100% da sua meta!',
    ]
  },
  {
    title: 'Simulador de Juros',
    icon: Calculator,
    description: 'Projete o crescimento do seu dinheiro com juros compostos.',
    details: [
      'Informe um valor inicial e aportes mensais.',
      'Defina a taxa de juros (mensal ou anual).',
      'Veja a projeção de crescimento em um gráfico interativo.',
      'Entenda quanto será juros e quanto será dinheiro investido.',
    ]
  },
];

const investidorSlides = [
  {
    title: 'Ações',
    icon: TrendingUp,
    description: 'Acompanhe a bolsa de valores e cotações em tempo real.',
    details: [
      'Visualize cotações de ações da B3 (PETR4, VALE3, ITUB4...).',
      'Acompanhe a variação percentual do dia.',
      'Carrossel de moedas mostra Dólar, Euro e Bitcoin.',
      'Dados atualizados automaticamente a cada 30 segundos.',
    ]
  },
  {
    title: 'Patrimônio',
    icon: Wallet,
    description: 'Gerencie sua carteira de investimentos.',
    details: [
      'Registre seus ativos (Ações, FIIs, Renda Fixa, Criptomoedas).',
      'Veja o valor total do seu patrimônio consolidado.',
      'Acompanhe a valorização de cada ativo ao longo do tempo.',
      'Planeje rebalanceamento para manter sua estratégia.',
    ]
  },
];

type TabType = 'poupador' | 'investidor';

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<TabType>('poupador');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = activeTab === 'poupador' ? poupadorSlides : investidorSlides;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentSlide(0);
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Central de Ajuda</h1>
        <p className="opacity-60">Entenda como usar cada funcionalidade do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTabChange('poupador')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'poupador'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'glass-card opacity-60 hover:opacity-100'
          }`}
        >
          <PiggyBank className="w-5 h-5" />
          Poupador
        </button>
        <button
          onClick={() => handleTabChange('investidor')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'investidor'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'glass-card opacity-60 hover:opacity-100'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Investidor
        </button>
      </div>

      {/* Carousel Card */}
      <div className="glass-card p-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

        {/* Slide Content */}
        <div className="relative z-10">
          {/* Icon and Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentSlideData.title}</h2>
              <p className="opacity-60">{currentSlideData.description}</p>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-3 mb-8">
            {currentSlideData.details.map((detail, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-4 rounded-xl bg-current/[0.02] border border-current/5"
              >
                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary-500 text-sm font-bold">{idx + 1}</span>
                </div>
                <p className="opacity-80">{detail}</p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevSlide}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:bg-primary-500/10 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlide 
                      ? 'w-8 bg-primary-500' 
                      : 'w-2 bg-current/10 hover:bg-current/20'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:bg-primary-500/10 transition-all"
            >
              Próxima
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="text-center opacity-40 text-sm">
        Página {currentSlide + 1} de {slides.length} • {activeTab === 'poupador' ? 'Perfil Poupador' : 'Perfil Investidor'}
      </div>
    </div>
  );
}
