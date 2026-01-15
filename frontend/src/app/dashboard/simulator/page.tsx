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
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 w-full max-w-full">
      {/* Header */}
      <div className="py-2">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">Simulador de Juros</h1>
        <p className="opacity-40 text-xs sm:text-sm font-bold uppercase tracking-wider mt-1">Planeje seu futuro financeiro</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-full">
        {/* Sidebar Inputs */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 min-w-0">
          <div className="glass-card p-4 sm:p-6 space-y-5 sm:space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-500" />
              Parâmetros
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase opacity-40 tracking-wider">Valor inicial</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-primary-500 transition-colors text-sm font-bold">R$</span>
                  <input
                    type="number"
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.target.value)}
                    className="input-field pl-12 text-sm sm:text-base"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase opacity-40 tracking-wider">Valor mensal</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-primary-500 transition-colors text-sm font-bold">R$</span>
                  <input
                    type="number"
                    value={monthlyValue}
                    onChange={(e) => setMonthlyValue(e.target.value)}
                    className="input-field pl-12 text-sm sm:text-base"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase opacity-40 tracking-wider">Taxa de juros</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group min-w-0">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-primary-500 transition-colors text-sm font-bold">%</span>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="input-field pl-10 text-sm sm:text-base w-full"
                      placeholder="0,00"
                    />
                  </div>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="input-field w-auto px-3 sm:px-4 py-3 cursor-pointer text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0"
                  >
                    <option value="monthly" className="bg-[var(--sidebar-bg)] font-sans">Mensal</option>
                    <option value="annual" className="bg-[var(--sidebar-bg)] font-sans">Anual</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase opacity-40 tracking-wider">Período</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="flex-1 min-w-0 input-field text-sm sm:text-base"
                    placeholder="0"
                  />
                  <select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value as any)}
                    className="input-field w-auto px-3 sm:px-4 py-3 cursor-pointer text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0"
                  >
                    <option value="months" className="bg-[var(--sidebar-bg)] font-sans">Meses</option>
                    <option value="years" className="bg-[var(--sidebar-bg)] font-sans">Anos</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => calculate()}
                className="btn-primary w-full shadow-emerald-500/20 active:scale-[0.98]"
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
                className="w-full py-3 rounded-xl border border-current/10 opacity-40 hover:opacity-100 hover:bg-current/5 transition-all text-sm"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-4 flex gap-3 overflow-hidden">
            <Info className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm opacity-50 leading-relaxed font-medium flex-1 min-w-0">
              O cálculo de juros compostos com aportes mensais considera que os depósitos são realizados no final de cada mês.
            </p>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="glass-card p-4 sm:p-6 border-l-4 border-primary-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <p className="opacity-40 text-[10px] sm:text-sm mb-1 uppercase tracking-wider font-black">Valor total final</p>
              <p className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="glass-card p-4 sm:p-6 border-l-4 border-primary-500/40">
              <p className="opacity-40 text-[10px] sm:text-sm mb-1 uppercase tracking-wider font-black">Total investido</p>
              <p className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="glass-card p-4 sm:p-6 border-l-4 border-emerald-500">
              <p className="opacity-40 text-[10px] sm:text-sm mb-1 uppercase tracking-wider font-black">Total em juros</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-500 tracking-tight tabular-nums">{formatCurrency(totalInterest)}</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="glass-card p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
               <h3 className="text-base sm:text-lg font-black uppercase tracking-wider opacity-60">Projeção</h3>
               <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-sm bg-primary-500" />
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Investido</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-500/30" />
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Juros</span>
                 </div>
               </div>
            </div>
            
            <div className="h-72 mt-4 relative flex gap-4 min-w-0">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between h-[calc(100%-32px)] text-[10px] opacity-30 font-medium tabular-nums w-10 text-right">
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
                      <div className="absolute bottom-full mb-3 bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none whitespace-nowrap shadow-2xl scale-95 group-hover:scale-100 origin-bottom">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3 h-3 text-primary-500" />
                          <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider">Período: {data.month} meses</span>
                        </div>
                        <p className="text-sm font-bold mb-2">{formatCurrency(data.balance)}</p>
                        <div className="space-y-1 pt-2 border-t border-current/5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] opacity-60">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                              <span>Investido:</span>
                            </div>
                            <span className="text-[10px] font-medium">{formatCurrency(data.totalInvested)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] opacity-60">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Juros:</span>
                            </div>
                            <span className="text-[10px] text-emerald-500 font-medium">{formatCurrency(data.totalInterest)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Interactive Column */}
                      <div className="w-full flex flex-col justify-end h-full">
                         {/* Interest Segment */}
                         <div 
                          className="w-full bg-emerald-500/40 border-t border-emerald-500/30 rounded-t-lg transition-all duration-500 group-hover:bg-emerald-500/50"
                          style={{ height: `${(data.totalInterest / maxVal) * 100}%` }}
                        />
                        {/* Invested Segment */}
                        <div 
                          className="w-full bg-primary-500 border-t border-primary-400/30 transition-all duration-500 group-hover:bg-primary-400"
                          style={{ height: `${(data.totalInvested / maxVal) * 100}%`, borderRadius: data.totalInterest === 0 ? '8px 8px 0 0' : '0' }}
                        />
                      </div>
                      <span className="text-[9px] opacity-20 mt-3 font-medium uppercase tracking-tighter truncate w-full text-center">
                        {data.month === 0 ? "0" : data.month % 12 === 0 ? `${data.month / 12}a` : `${data.month}m`}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Grid System */}
                <div className="absolute inset-0 -z-10 flex flex-col justify-between pointer-events-none pb-[21px]">
                  <div className="w-full h-px bg-current/5" />
                  <div className="w-full h-px bg-current/5" />
                  <div className="w-full h-px bg-current/5" />
                  <div className="w-full h-px bg-current/5" />
                  <div className="w-full h-px border-b border-primary-500/10" />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="glass-card overflow-hidden w-full max-w-full">
            <div className="p-6 thin-border-b bg-current/[0.01]">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-500" />
                Detalhamento Mensal
              </h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="sticky top-0 z-10 bg-[var(--sidebar-bg)] backdrop-blur">
                  <tr className="text-current opacity-30 text-[10px] uppercase font-black tracking-widest border-b border-current/[0.05]">
                    <th className="py-4 px-3 sm:px-6 whitespace-nowrap">Mês</th>
                    <th className="py-4 px-3 sm:px-6 whitespace-nowrap">Juros</th>
                    <th className="py-4 px-3 sm:px-6 text-right whitespace-nowrap">Acumulado</th>
                    <th className="py-4 px-3 sm:px-6 text-right whitespace-nowrap">Investido</th>
                    <th className="py-4 px-3 sm:px-6 text-right whitespace-nowrap">Saldo</th>
                  </tr>
                </thead>
                <tbody className="thin-divide">
                  {results.map((row, idx) => {
                    const isLast = idx === results.length - 1 && results.length > 1
                    return (
                      <tr
                        key={row.month}
                        className={`group transition-colors ${
                          isLast ? "bg-primary-500/[0.03] border-t-2 border-primary-500/20" : "hover:bg-primary-500/[0.02]"
                        }`}
                      >
                        <td
                          className={`py-4 px-3 sm:px-6 font-medium text-sm whitespace-nowrap ${isLast ? "text-primary-500 font-black" : "opacity-60"}`}
                        >
                          {row.month === 0 ? "Início" : isLast ? `FINAL` : `${row.month}`}
                        </td>
                        <td
                          className={`py-4 px-3 sm:px-6 font-medium text-sm whitespace-nowrap ${isLast ? "text-emerald-500 font-black" : "text-emerald-500"}`}
                        >
                          {row.month === 0 ? "-" : formatCurrency(row.interest)}
                        </td>
                        <td
                          className={`py-4 px-3 sm:px-6 text-right tabular-nums text-sm whitespace-nowrap ${isLast ? "opacity-80 font-bold" : "opacity-40"}`}
                        >
                          {row.month === 0 ? "-" : formatCurrency(row.totalInterest)}
                        </td>
                        <td
                          className={`py-4 px-3 sm:px-6 text-right tabular-nums text-sm whitespace-nowrap ${isLast ? "opacity-80 font-bold" : "opacity-40"}`}
                        >
                          {formatCurrency(row.totalInvested)}
                        </td>
                        <td
                          className={`py-4 px-3 sm:px-6 text-right tabular-nums text-sm whitespace-nowrap ${isLast ? "font-black text-base" : "font-semibold"}`}
                        >
                          {formatCurrency(row.balance)}
                        </td>
                      </tr>
                    )
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
