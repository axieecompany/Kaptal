'use client';

import { FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ReportButtonProps {
  onGeneratePDF?: () => Promise<void>;
  onGenerateExcel?: () => Promise<void>;
  label?: string;
  className?: string;
}

export default function ReportButton({
  onGeneratePDF,
  onGenerateExcel,
  label = 'Relatório',
  className = '',
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);

  const handlePDF = async () => {
    if (!onGeneratePDF) return;
    setIsLoadingPDF(true);
    try {
      await onGeneratePDF();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoadingPDF(false);
      setIsOpen(false);
    }
  };

  const handleExcel = async () => {
    if (!onGenerateExcel) return;
    setIsLoadingExcel(true);
    try {
      await onGenerateExcel();
    } catch (error) {
      console.error('Error generating Excel:', error);
    } finally {
      setIsLoadingExcel(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-bold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all active:scale-95"
      >
        <FileDown className="w-5 h-5" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 glass-card p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={handlePDF}
              disabled={isLoadingPDF || !onGeneratePDF}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-current/5 transition-colors disabled:opacity-50"
            >
              {isLoadingPDF ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
              ) : (
                <FileText className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">Baixar PDF</span>
            </button>
            
            <button
              onClick={handleExcel}
              disabled={isLoadingExcel || !onGenerateExcel}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-current/5 transition-colors disabled:opacity-50"
            >
              {isLoadingExcel ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              )}
              <span className="font-medium">Baixar Excel</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
