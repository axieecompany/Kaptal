"use client";

import {
    Calculator,
    Calendar,
    Info
} from 'lucide-react';
import { useEffect, useState } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface SimulationResult {
  month: number;
  interest: number;
  totalInterest: number;
  totalInvested: number;
  balance: number;
}

export default function SimulatorPage() {
  const [initialValue, setInitialValue] = useState('5000');
  const [monthlyValue, setMonthlyValue] = useState('1000');
  const [interestRate, setInterestRate] = useState('1');
  const [rateType, setRateType] = useState<'monthly' | 'annual'>('monthly');
  const [period, setPeriod] = useState('10');
  const [periodType, setPeriodType] = useState<'months' | 'years'>('years');
  
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    calculate();
  }, [initialValue, monthlyValue, interestRate, rateType, period, periodType]);

  const calculate = () => {
    const p = parseFloat(initialValue) || 0;
    const pmt = parseFloat(monthlyValue) || 0;
    let r = parseFloat(interestRate) || 0;
    let t = parseInt(period) || 0;

    if (t <= 0) {
      setResults([]);
      setTotalInvested(0);
      setTotalInterest(0);
      setTotalBalance(0);
      return;
    }

    // Convert period to months
    const totalMonths = periodType === 'years' ? t * 12 : t;
    
    // Convert rate to monthly decimal
    let i = r / 100;
    if (rateType === 'annual') {
      // Monthly equivalent of annual rate: (1 + i_annual)^(1/12) - 1
      i = Math.pow(1 + i, 1 / 12) - 1;
    }

    const simulation: SimulationResult[] = [];
    let currentBalance = p;
    let accumulatedInvestment = p;
    let accumulatedInterest = 0;

    // Month 0
    simulation.push({
      month: 0,
      interest: 0,
      totalInterest: 0,
      totalInvested: p,
      balance: p
    });

    for (let m = 1; m <= totalMonths; m++) {
      const interestForMonth = currentBalance * i;
      currentBalance += interestForMonth + pmt;
      accumulatedInvestment += pmt;
      accumulatedInterest += interestForMonth;

      simulation.push({
        month: m,
        interest: interestForMonth,
        totalInterest: accumulatedInterest,
        totalInvested: accumulatedInvestment,
        balance: currentBalance
      });
    }

    setResults(simulation);
    setTotalInvested(accumulatedInvestment);
    setTotalInterest(accumulatedInterest);
    setTotalBalance(currentBalance);
  };

  // Helper for chart points
  const points = results.filter((_, idx) => {
    if (results.length <= 12) return true;
    if (results.length <= 60) return idx % 6 === 0 || idx === results.length - 1;
    return idx % 12 === 0 || idx === results.length - 1;
  });

  const maxVal = Math.max(totalBalance, 1);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Simulador de Juros Compostos</h1>
        <p className="text-white/60">Planeje seu futuro financeiro e veja seu dinheiro crescer</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-400" />
              Parâmetros
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Valor inicial</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary-400 transition-colors">R$</span>
                  <input
                    type="number"
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Valor mensal</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary-400 transition-colors">R$</span>
                  <input
                    type="number"
                    value={monthlyValue}
                    onChange={(e) => setMonthlyValue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Taxa de juros</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary-400 transition-colors">%</span>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                      placeholder="0,00"
                    />
                  </div>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Período</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="0"
                  />
                  <select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer"
                  >
                    <option value="months">Meses</option>
                    <option value="years">Anos</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => {
                   setInitialValue('5000');
                   setMonthlyValue('1000');
                   setInterestRate('1');
                   setPeriod('10');
                   setRateType('monthly');
                   setPeriodType('years');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-semibold transition-all shadow-lg shadow-primary-500/20 active:scale-[0.98]"
              >
                Calcular
              </button>
              <button
                onClick={() => {
                  setInitialValue('');
                  setMonthlyValue('');
                  setInterestRate('');
                  setPeriod('');
                }}
                className="w-full py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
            <p className="text-sm text-white/50 leading-relaxed">
              O cálculo de juros compostos com aportes mensais considera que os depósitos são realizados no final de cada mês.
            </p>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Stats */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="glass-card p-6 bg-gradient-to-br from-primary-500/10 to-transparent border-primary-500/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <p className="text-white/40 text-sm mb-1 uppercase tracking-wider font-semibold">Valor total final</p>
              <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="glass-card p-6">
              <p className="text-white/40 text-sm mb-1 uppercase tracking-wider font-semibold">Valor total investido</p>
              <p className="text-xl font-bold text-white tracking-tight">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="glass-card p-6 border-green-500/20">
              <p className="text-white/40 text-sm mb-1 uppercase tracking-wider font-semibold">Total em juros</p>
              <p className="text-xl font-bold text-green-400 tracking-tight">{formatCurrency(totalInterest)}</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-semibold text-white">Projeção de Crescimento</h3>
               <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-sm bg-primary-500" />
                   <span className="text-xs text-white/40">Investido</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-sm bg-green-500/40 border border-green-500/30" />
                   <span className="text-xs text-white/40">Juros</span>
                 </div>
               </div>
            </div>
            
            <div className="h-72 mt-4 relative flex gap-4">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between h-[calc(100%-32px)] text-[10px] text-white/30 font-medium tabular-nums w-10 text-right">
                {[...Array(5)].map((_, i) => {
                  const val = maxVal * (1 - i / 4);
                  const formatted = val >= 1000000 
                    ? (val / 1000000).toFixed(1).replace('.0', '') + 'M'
                    : val >= 1000 
                    ? (val / 1000).toFixed(0) + 'k'
                    : val.toFixed(0);
                  return <span key={i}>R$ {formatted}</span>;
                })}
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0 flex items-end gap-1 px-2">
                  {points.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-3 bg-[#11111a] border border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none whitespace-nowrap shadow-2xl scale-95 group-hover:scale-100 origin-bottom">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3 h-3 text-primary-400" />
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Período: {data.month} meses</span>
                        </div>
                        <p className="text-sm font-bold text-white mb-2">{formatCurrency(data.balance)}</p>
                        <div className="space-y-1 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                              <span>Investido:</span>
                            </div>
                            <span className="text-[10px] text-white font-medium">{formatCurrency(data.totalInvested)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span>Juros:</span>
                            </div>
                            <span className="text-[10px] text-green-400 font-medium">{formatCurrency(data.totalInterest)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Interactive Column */}
                      <div className="w-full flex flex-col justify-end h-full">
                         {/* Interest Segment */}
                         <div 
                          className="w-full bg-green-500/40 border-t border-green-500/30 rounded-t-lg transition-all duration-500 group-hover:bg-green-500/50"
                          style={{ height: `${(data.totalInterest / maxVal) * 100}%` }}
                        />
                        {/* Invested Segment */}
                        <div 
                          className="w-full bg-primary-500 border-t border-primary-400/30 transition-all duration-500 group-hover:bg-primary-400"
                          style={{ height: `${(data.totalInvested / maxVal) * 100}%`, borderRadius: data.totalInterest === 0 ? '8px 8px 0 0' : '0' }}
                        />
                      </div>
                      <span className="text-[9px] text-white/20 mt-3 font-medium uppercase tracking-tighter truncate w-full text-center">
                        {data.month === 0 ? "0" : data.month % 12 === 0 ? `${data.month / 12}a` : `${data.month}m`}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Grid System */}
                <div className="absolute inset-0 -z-10 flex flex-col justify-between pointer-events-none pb-[21px]">
                  <div className="w-full h-px bg-white/5" />
                  <div className="w-full h-px bg-white/5" />
                  <div className="w-full h-px bg-white/5" />
                  <div className="w-full h-px bg-white/5" />
                  <div className="w-full h-px border-b border-primary-500/10" />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="glass-card overflow-hidden">
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Detalhamento Mensal</h3>
              <div className="text-xs text-white/40 italic">
                 Mostrando todos os {results.length} meses
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#11111a] text-white/30 text-[10px] uppercase font-bold tracking-widest">
                    <th className="py-4 px-8 border-b border-white/10">Mês</th>
                    <th className="py-4 px-8 border-b border-white/10">Juros do Mês</th>
                    <th className="py-4 px-8 border-b border-white/10 text-right">Acumulado em Juros</th>
                    <th className="py-4 px-8 border-b border-white/10 text-right">Total Investido</th>
                    <th className="py-4 px-8 border-b border-white/10 text-right">Saldo Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map((row, idx) => {
                    const isLast = idx === results.length - 1 && results.length > 1;
                    return (
                      <tr 
                        key={row.month} 
                        className={`group transition-colors ${
                          isLast 
                            ? "bg-primary-500/[0.03] border-t-2 border-primary-500/20 shadow-[0_-8px_16px_-8px_rgba(37,99,235,0.1)]" 
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className={`py-4 px-8 font-medium ${isLast ? "text-primary-400 font-black" : "text-white/60"}`}>
                          {row.month === 0 ? "Início" : isLast ? `FINAL (Mês ${row.month})` : `Mês ${row.month}`}
                        </td>
                        <td className={`py-4 px-8 font-medium ${isLast ? "text-green-400 font-black" : "text-green-400"}`}>
                          {row.month === 0 ? "-" : formatCurrency(row.interest)}
                        </td>
                        <td className={`py-4 px-8 text-right tabular-nums ${isLast ? "text-white/80 font-bold" : "text-white/40"}`}>
                          {row.month === 0 ? "-" : formatCurrency(row.totalInterest)}
                        </td>
                        <td className={`py-4 px-8 text-right tabular-nums ${isLast ? "text-white/80 font-bold" : "text-white/40"}`}>
                           {formatCurrency(row.totalInvested)}
                        </td>
                        <td className={`py-4 px-8 text-right tabular-nums ${isLast ? "text-white font-black text-lg" : "text-white font-semibold"}`}>
                          {formatCurrency(row.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
