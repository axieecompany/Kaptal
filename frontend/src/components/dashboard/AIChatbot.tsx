'use client';

import { useAIAdvisor } from '@/contexts/AIAdvisorContext';
import { aiApi } from '@/lib/api';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatbot() {
  const { isOpen, closeAdvisor } = useAIAdvisor();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o Kaptal Advisor. Como posso ajudar com suas finanças hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Send current message + history (excluding the first greeting)
      const res = await aiApi.chat(userMsg, messages.slice(1));
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, tive um problema ao processar sua solicitação com o motor Gemini 3.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile and better focus */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] transition-all duration-500 lg:hidden"
          onClick={closeAdvisor}
        />
      )}

      {/* Side Drawer */}
      <div className={`
        fixed top-0 right-0 h-screen w-full sm:w-[550px] z-[50]
        bg-[var(--sidebar-bg)] backdrop-blur-2xl border-l border-[var(--sidebar-border)] 
        shadow-2xl flex flex-col transition-all duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--sidebar-border)] flex items-center justify-between bg-gradient-to-r from-primary-500/5 to-accent-500/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white shadow-xl rotate-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Kaptal Advisor</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] opacity-60 font-bold uppercase tracking-wider">Online • Gemini 3.0</span>
              </div>
            </div>
          </div>
          <button 
            onClick={closeAdvisor} 
            className="p-2.5 hover:bg-current/5 rounded-xl transition-all group"
          >
            <X className="w-6 h-6 opacity-40 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        {/* Messages Section */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary-500 text-white rounded-tr-none' 
                  : 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-3xl rounded-tl-none flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-xs opacity-60 font-medium italic">Analisando suas finanças...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="p-6 border-t border-[var(--sidebar-border)] bg-gradient-to-t from-[var(--background)] to-transparent">
          <div className="relative group">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Como posso te ajudar hoje?"
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary-500/30 transition-all outline-none group-hover:border-primary-500/40"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary-500 text-white rounded-xl disabled:opacity-20 transition-all hover:bg-primary-600 shadow-lg active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center opacity-30 mt-4 font-bold uppercase tracking-widest">
            Kaptal Intelligence Protocol v3.0
          </p>
        </div>
      </div>
    </>
  );
}
