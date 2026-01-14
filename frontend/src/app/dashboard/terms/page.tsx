'use client';

import { ChevronDown, ChevronUp, FileText, Scale, Shield } from 'lucide-react';
import { useState } from 'react';

const termsData = [
  {
    title: '1. Aceitação dos Termos',
    content: `Ao acessar e utilizar o Kaptal, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços. O uso contínuo da plataforma constitui aceitação de quaisquer alterações ou atualizações dos termos.`
  },
  {
    title: '2. Descrição do Serviço',
    content: `O Kaptal é uma plataforma de gestão financeira pessoal que permite aos usuários:
    
• Registrar e categorizar receitas e despesas
• Definir metas de economia e orçamentos mensais
• Simular investimentos com juros compostos
• Acompanhar cotações de ações e moedas (dados informativos)
• Gerenciar patrimônio pessoal

O serviço é oferecido "como está" e pode ser modificado a qualquer momento.`
  },
  {
    title: '3. Cadastro e Conta',
    content: `Para utilizar o Kaptal, você deve criar uma conta fornecendo informações verdadeiras e atualizadas. Você é responsável por:

• Manter a confidencialidade de suas credenciais de acesso
• Todas as atividades realizadas em sua conta
• Notificar imediatamente sobre qualquer uso não autorizado

Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.`
  },
  {
    title: '4. Privacidade e Dados',
    content: `Seus dados financeiros são criptografados e armazenados de forma segura. Não compartilhamos suas informações pessoais com terceiros, exceto quando:

• Exigido por lei ou ordem judicial
• Necessário para prestação do serviço
• Com seu consentimento expresso

Você pode solicitar a exclusão de todos os seus dados a qualquer momento através do suporte.`
  },
  {
    title: '5. Limitações de Responsabilidade',
    content: `O Kaptal não é uma instituição financeira e não oferece aconselhamento de investimentos. As informações disponibilizadas são meramente informativas e não constituem recomendação de compra ou venda de ativos.

Não nos responsabilizamos por:
• Decisões financeiras tomadas com base nas informações do sistema
• Perdas decorrentes de investimentos
• Dados de cotações que podem ter delay de até 15 minutos
• Interrupções temporárias do serviço`
  },
  {
    title: '6. Uso Adequado',
    content: `Ao utilizar o Kaptal, você concorda em não:

• Utilizar o serviço para fins ilegais
• Tentar acessar dados de outros usuários
• Realizar engenharia reversa ou modificar o sistema
• Sobrecarregar nossos servidores com requisições excessivas
• Transmitir vírus ou código malicioso`
  },
  {
    title: '7. Propriedade Intelectual',
    content: `Todo o conteúdo do Kaptal, incluindo mas não limitado a textos, gráficos, logos, ícones, imagens e software, é propriedade da AXIEE ou de seus licenciadores e está protegido por leis de direitos autorais.

É permitido o uso pessoal e não comercial do serviço. Qualquer reprodução ou distribuição não autorizada é estritamente proibida.`
  },
  {
    title: '8. Alterações nos Termos',
    content: `Podemos atualizar estes Termos de Uso periodicamente. Quando fizermos alterações significativas, notificaremos você por email ou através de um aviso no sistema.

A continuação do uso do serviço após as alterações constitui aceitação dos novos termos.`
  },
  {
    title: '9. Contato',
    content: `Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do email: suporte@kaptal.com.br

Última atualização: Janeiro de 2026`
  }
];

export default function TermsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(termsData.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Scale className="w-7 h-7 text-primary-500" />
            Termos de Uso
          </h1>
          <p className="opacity-60">Leia atentamente os termos e condições do Kaptal</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={expandAll}
            className="text-sm px-4 py-2 rounded-lg glass-card hover:bg-primary-500/10 transition-all"
          >
            Expandir Tudo
          </button>
          <button 
            onClick={collapseAll}
            className="text-sm px-4 py-2 rounded-lg glass-card hover:bg-primary-500/10 transition-all"
          >
            Recolher Tudo
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-6 border-l-4 border-primary-500 flex items-start gap-4">
        <Shield className="w-6 h-6 text-primary-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold mb-1">Sua privacidade é importante</h3>
          <p className="text-sm opacity-60">
            Ao utilizar o Kaptal, você concorda com nossos termos. Recomendamos a leitura completa para entender seus direitos e responsabilidades.
          </p>
        </div>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {termsData.map((section, index) => (
          <div 
            key={index}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => toggleSection(index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-primary-500/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-500" />
                <span className="font-semibold">{section.title}</span>
              </div>
              {expandedSections.has(index) ? (
                <ChevronUp className="w-5 h-5 opacity-40" />
              ) : (
                <ChevronDown className="w-5 h-5 opacity-40" />
              )}
            </button>

            {expandedSections.has(index) && (
              <div className="px-5 pb-5 pt-0">
                <div className="pl-8">
                  <p className="opacity-70 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center opacity-40 text-sm pt-4">
        <p>© 2026 Kaptal by AXIEE. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
