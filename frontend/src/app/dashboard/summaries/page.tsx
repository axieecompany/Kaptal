'use client';

import { aiApi } from '@/lib/api';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileText,
  Loader2,
  PieChart as PieChartIcon,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  X
} from 'lucide-react';
import { useRef, useState } from 'react';

interface CSVRow {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
}

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categories: { name: string; value: number }[];
  timeline: { name: string; value: number }[];
}

export default function SummariesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [data, setData] = useState<CSVRow[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        setIsParsing(false);
        return;
      }

      // Detect delimiter
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      
      const headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim());
      
      // Try to find column indexes
      const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('hist') || h.includes('memo'));
      const amountIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('quant'));

      const rows: CSVRow[] = [];
      
      // If we couldn't find headers, assume standard order [0, 1, 2]
      const finalDateIdx = dateIdx !== -1 ? dateIdx : 0;
      const finalDescIdx = descIdx !== -1 ? descIdx : 1;
      const finalAmountIdx = amountIdx !== -1 ? amountIdx : 2;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter);
        if (parts.length <= Math.max(finalDateIdx, finalDescIdx, finalAmountIdx)) continue;

        // Clean quotes from all fields
        const date = parts[finalDateIdx].trim().replace(/^["']|["']$/g, '');
        const description = parts[finalDescIdx].trim().replace(/^["']|["']$/g, '');
        
        let amountStr = parts[finalAmountIdx].trim()
          .replace('R$', '')
          .replace(/"/g, '')
          .replace(/\s/g, '');

        if (amountStr.includes(',') && amountStr.includes('.')) {
          amountStr = amountStr.replace(/\./g, '').replace(',', '.');
        } else if (amountStr.includes(',')) {
          amountStr = amountStr.replace(',', '.');
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) continue;

        rows.push({
          date,
          description,
          amount: Math.abs(amount),
          type: amount >= 0 ? 'INCOME' : 'EXPENSE'
        });
      }

      setData(rows);
      calculateSummary(rows);
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const calculateSummary = (rows: CSVRow[]) => {
    const income = rows.filter(r => r.type === 'INCOME').reduce((acc, r) => acc + r.amount, 0);
    const expense = rows.filter(r => r.type === 'EXPENSE').reduce((acc, r) => acc + r.amount, 0);
    
    const categoriesMap: Record<string, number> = {};
    const weeksMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    rows.forEach(r => {
      // Categories
      if (r.type === 'EXPENSE') {
        let cat = 'Outros';
        const desc = r.description.toLowerCase();
        
        if (desc.includes('market') || desc.includes('super')) cat = 'Mercado';
        else if (desc.includes('ubereats') || desc.includes('ifood')) cat = 'Alimentação';
        else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('steam')) cat = 'Lazer';
        else if (desc.includes('posto') || desc.includes('uber') || desc.includes('99')) cat = 'Transporte';
        else if (desc.includes('pix') || desc.includes('transferência') || desc.includes('ted') || desc.includes('doc')) cat = 'Transferências';
        else if (desc.includes('fatura') || desc.includes('nubank') || desc.includes('cartão')) cat = 'Cartão/Fatura';
        else if (desc.includes('saque') || desc.includes('dinheiro')) cat = 'Saques';
        else if (desc.includes('seguro') || desc.includes('saúde') || desc.includes('hospital') || desc.includes('farmácia')) cat = 'Saúde/Seguro';
        
        categoriesMap[cat] = (categoriesMap[cat] || 0) + r.amount;
      }

      // Timeline logic (Better date matching for DD/MM/YYYY or YYYY-MM-DD or quote-enclosed)
      const dayMatches = r.date.match(/(\d{1,2})/); // Find first number group instead of strictly at start
      if (dayMatches) {
        const day = parseInt(dayMatches[1]);
        if (day >= 1 && day <= 31) {
          const week = Math.min(Math.ceil(day / 7), 5);
          weeksMap[week] = (weeksMap[week] || 0) + r.amount;
        }
      }
    });

    const categoryData = Object.entries(categoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const timelineData = Object.entries(weeksMap).map(([name, value]) => ({ 
      name: `SEM ${name}`, 
      value 
    }));

    setSummary({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      categories: categoryData,
      timeline: timelineData
    });
  };

  const generateAIInsight = async () => {
    if (!summary || isAnalyzing) return;
    setIsAnalyzing(true);
    
    try {
      const prompt = `Analise este extrato financeiro simplificado e me dê 3 dicas práticas de onde posso economizar e como está minha saúde financeira este mês.
      DADOS:
      - Receitas Totais: R$ ${summary.totalIncome.toFixed(2)}
      - Despesas Totais: R$ ${summary.totalExpense.toFixed(2)}
      - Saldo: R$ ${summary.balance.toFixed(2)}
      - Categorias principais: ${summary.categories.map(c => `${c.name}: R$ ${c.value.toFixed(2)}`).join(', ')}
      
      Seja muito conciso e direto ao ponto.`;

      const response = await aiApi.chat(prompt, []);
      if (response.success) {
        setAiInsight(response.data.content);
      }
    } catch (err) {
      console.error('AI Insight error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Resumos Inteligentes</h1>
          <p className="opacity-60 mt-2">Analise seus extratos bancários instantaneamente com IA.</p>
        </div>
        
        {!summary ? (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 font-medium active:scale-95"
          >
            <Upload className="w-5 h-5" />
            Subir Extrato CSV
          </button>
        ) : (
          <button 
            onClick={() => {
              setSummary(null);
              setData([]);
              setAiInsight(null);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all font-medium active:scale-95"
          >
            <X className="w-5 h-5" />
            Limpar Dados
          </button>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".csv" 
          className="hidden" 
        />
      </div>

      {!summary ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="glass-card border-dashed border-2 border-primary-500/30 p-20 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-500 transition-all group"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Arraste seu arquivo CSV aqui</h3>
          <p className="opacity-40 max-w-sm">
            Aceitamos arquivos .csv de qualquer banco. Gere relatórios visuais e insights na hora.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="glass-card p-6 bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold opacity-60">Receitas</span>
                </div>
                <p className="text-2xl font-bold text-emerald-500">
                  R$ {summary.totalIncome.toLocaleString()}
                </p>
              </div>

              <div className="glass-card p-6 bg-red-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold opacity-60">Despesas</span>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  R$ {summary.totalExpense.toLocaleString()}
                </p>
              </div>

              <div className="glass-card p-6 bg-primary-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold opacity-60">Saldo</span>
                </div>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                  R$ {summary.balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Charts Section - Stacked Vertically for more space */}
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6 text-primary-500">
                  <PieChartIcon className="w-5 h-5" />
                  <h3 className="font-bold">Gastos por Categoria</h3>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
                  {summary.categories.map((cat, i) => {
                    const percentage = (cat.value / summary.totalExpense) * 100;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cat.name}</span>
                          <span className="opacity-60 font-bold">{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-current/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-14 text-accent-500">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="font-bold">Volume Financeiro por Semana</h3>
                </div>
                <div className="flex items-end justify-around h-64 gap-4 px-4">
                  {summary.timeline.map((week, i) => {
                    const maxVal = Math.max(...summary.timeline.map(t => t.value)) || 1;
                    const h = (week.value / maxVal) * 70; // Max 70% to leave plenty of room
                    return (
                      <div key={i} className="h-full w-full max-w-[80px] bg-accent-500/10 rounded-t-2xl relative group flex flex-col items-center">
                        <div 
                          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-accent-600 to-accent-400 rounded-t-2xl transition-all duration-1000 shadow-lg shadow-accent-500/20" 
                          style={{ height: `${h}%` }}
                        />
                        {/* Always show value for clarity since user had issues */}
                        <div className="absolute -top-10 bg-[var(--background)] px-2 py-1 rounded-lg border border-accent-500/20 text-[10px] font-bold shadow-sm whitespace-nowrap">
                          R$ {week.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-around mt-6 text-[11px] opacity-40 font-black tracking-widest uppercase">
                  {summary.timeline.map((week, i) => (
                    <span key={i}>{week.name}</span>
                  ))}
                </div>

                {/* Explanatory Texts */}
                <div className="mt-10 pt-6 border-t border-accent-500/10 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3 h-3 text-accent-500" />
                    </div>
                    <p className="text-xs opacity-50 font-medium leading-relaxed">
                      O gráfico acima representa o **volume total de movimentações** (soma de entradas e saídas) por semana. Ele ajuda você a entender em quais períodos do mês seu dinheiro circula com mais intensidade.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                    </div>
                    <p className="text-xs opacity-50 font-medium leading-relaxed italic">
                      Lembre-se: O Kaptal Advisor pode cometer erros de interpretação. Estes valores são extraídos diretamente do seu CSV e podem sofrer arredondamentos, mas buscamos a maior precisão possível com os dados fornecidos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Advisor Side */}
          <div className="space-y-6">
            <div className="glass-card p-6 border-accent-500/30 bg-accent-500/5 relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-20 h-20 text-accent-500" />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-accent-500 flex items-center justify-center text-white shadow-lg shadow-accent-500/30">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Kaptal Advisor</h3>
                  <p className="text-xs opacity-50 font-bold uppercase tracking-wider">Análise do Extrato</p>
                </div>
              </div>

              {!aiInsight ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-sm opacity-60 mb-6">
                    Clique abaixo para que a IA analise seu extrato e forneça dicas personalizadas de economia.
                  </p>
                  <button 
                    onClick={generateAIInsight}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent-500 text-white rounded-2xl hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/20 font-bold active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Gerar Análise IA
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  <div 
                    className="p-2 text-sm leading-relaxed font-bold"
                    style={{ color: 'var(--foreground, #0a0a0a)' }}
                  >
                    {aiInsight.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('-') || line.startsWith('*') ? 'mt-2 flex gap-2' : 'mt-2'}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] opacity-40 font-bold uppercase tracking-widest justify-center mt-4">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Análise Concluída com Gemini 3.0
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Features Info */}
      <div className="glass-card p-8 bg-amber-500/[0.03] border-2 border-amber-500/20 mt-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Sparkles className="w-24 h-24 text-amber-500" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center flex-shrink-0 animate-pulse">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-amber-600 mb-2 uppercase tracking-tight">Kaptal Pro: Histórico Completo</h3>
            <p className="opacity-70 text-sm font-bold leading-relaxed max-w-2xl">
              No plano Pro, suas análises de CSV deixam de ser voláteis! Você poderá salvar cada importação e navegar por um 
              <span className="text-amber-600"> histórico mensal inteligente</span>. 
              Basta selecionar o mês no menu para expandir instantaneamente os gráficos e insights daquela época.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black rounded-full text-center uppercase tracking-widest">
              Em Breve
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="glass-card p-6 bg-primary-500/5 mt-4">
        <div className="flex items-center gap-4 text-sm opacity-60">
          <AlertCircle className="w-5 h-5 text-primary-500" />
          <p className="font-medium">
            Atualmente, esta ferramenta gera uma análise **volátil**. Seus dados de CSV não estão sendo salvos permanentemente no banco de dados. 
          </p>
        </div>
      </div>
    </div>
  );
}

