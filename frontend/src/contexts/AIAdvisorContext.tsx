'use client';

import React, { createContext, useContext, useState } from 'react';

interface AIAdvisorContextType {
  isOpen: boolean;
  openAdvisor: () => void;
  closeAdvisor: () => void;
  toggleAdvisor: () => void;
}

const AIAdvisorContext = createContext<AIAdvisorContextType | undefined>(undefined);

export function AIAdvisorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAdvisor = () => setIsOpen(true);
  const closeAdvisor = () => setIsOpen(false);
  const toggleAdvisor = () => setIsOpen(prev => !prev);

  return (
    <AIAdvisorContext.Provider value={{ isOpen, openAdvisor, closeAdvisor, toggleAdvisor }}>
      {children}
    </AIAdvisorContext.Provider>
  );
}

export function useAIAdvisor() {
  const context = useContext(AIAdvisorContext);
  if (context === undefined) {
    throw new Error('useAIAdvisor must be used within an AIAdvisorProvider');
  }
  return context;
}
