'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useAIAdvisor } from '@/contexts/AIAdvisorContext';
import { useAuth } from '@/lib/auth';
import {
    ArrowLeftRight,
    Calculator,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Crown,
    FileText,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Menu,
    PiggyBank,
    Scale,
    Sparkles,
    Target,
    TrendingUp,
    UserCircle,
    Wallet,
    X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggleAdvisor } = useAIAdvisor();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['poupador', 'investidor']));

  const navGroups = [
    {
      title: 'Poupador',
      id: 'poupador',
      icon: PiggyBank,
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/transactions', label: 'Transações', icon: ArrowLeftRight },
        { href: '/dashboard/goals', label: 'Gastos', icon: Target },
        { href: '/dashboard/reports', label: 'Relatórios', icon: FileText },
        { href: '/dashboard/summaries', label: 'Resumos', icon: Scale },
        { href: '/dashboard/savings', label: 'Metas', icon: PiggyBank },
        { href: '/dashboard/simulator', label: 'Simulador', icon: Calculator },
        { onClick: toggleAdvisor, label: 'Kaptal Advisor', icon: Sparkles, premium: true },
        { href: '/dashboard/profile', label: 'Perfil', icon: UserCircle },
      ]
    },
    {
      title: 'Investidor',
      id: 'investidor',
      icon: TrendingUp,
      items: [
        { href: '/dashboard/stocks', label: 'Ações', icon: TrendingUp },
        { href: '/dashboard/patrimony', label: 'Patrimônio', icon: Wallet },
      ]
    },
    {
      title: 'Ajuda',
      id: 'ajuda',
      icon: HelpCircle,
      items: [
        { href: '/dashboard/plans', label: 'Planos', icon: Crown },
        { href: '/dashboard/help', label: 'Dúvidas', icon: HelpCircle },
        { href: '/dashboard/terms', label: 'Termos de Uso', icon: Scale },
      ]
    }
  ];

  const toggleGroup = (id: string) => {
    if (isCollapsed) return;
    const newGroups = new Set(expandedGroups);
    if (newGroups.has(id)) {
      newGroups.delete(id);
    } else {
      newGroups.add(id);
    }
    setExpandedGroups(newGroups);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-current/10 backdrop-blur text-[var(--foreground)]"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen
        ${isCollapsed ? 'lg:w-20' : 'w-64'} 
        bg-[var(--sidebar-bg)] backdrop-blur-xl border-r border-[var(--sidebar-border)]
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full relative">
          {/* Collapse Toggle Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-primary-500 rounded-full items-center justify-center text-white border border-white/10 shadow-lg z-50 hover:bg-primary-400 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Logo & Theme Toggle */}
          <div className={`p-6 border-b border-[var(--sidebar-border)] flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : ''}`}>
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && <span className="text-xl font-bold gradient-text">Kaptal</span>}
            </Link>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {navGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  disabled={isCollapsed}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg
                    text-xs font-bold uppercase tracking-wider transition-colors
                    ${isCollapsed ? 'justify-center opacity-20' : 'opacity-40 hover:opacity-100'}
                  `}
                >
                  {isCollapsed ? (
                     <div className="h-px w-8 bg-current opacity-10" />
                  ) : (
                    <>
                      <span>{group.title}</span>
                      {expandedGroups.has(group.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {/* Group Items */}
                {(expandedGroups.has(group.id) || isCollapsed) && (
                  <div className="space-y-1">
                    {group.items.map((item, idx) => {
                      const isActive = item.href ? (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;
                      const Icon = item.icon;
                      const commonClasses = `
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isActive 
                          ? 'bg-primary-500/20 text-primary-500 font-medium' 
                          : 'opacity-60 hover:bg-primary-500/5 hover:opacity-100'}
                        ${item.premium ? 'text-accent-500' : ''}
                      `;
                      
                      if (item.href) {
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={commonClasses}
                            title={isCollapsed ? item.label : ''}
                          >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!isCollapsed && (
                              <div className="flex items-center justify-between flex-1">
                                <span>{item.label}</span>
                                {item.premium && <Sparkles className="w-3 h-3 text-accent-500" />}
                              </div>
                            )}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.onClick) item.onClick();
                            setIsOpen(false);
                          }}
                          className={commonClasses}
                          title={isCollapsed ? item.label : ''}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          {!isCollapsed && (
                            <div className="flex items-center justify-between flex-1">
                              <span>{item.label}</span>
                              {item.premium && <Sparkles className="w-3 h-3 text-accent-500" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[var(--sidebar-border)]">
            <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shrink-0">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.name}</p>
                  <p className="opacity-40 text-sm truncate">{user?.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className={`
                flex items-center gap-2 w-full px-4 py-2 rounded-xl opacity-60 hover:bg-primary-500/5 hover:opacity-100 transition-all
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Sair' : ''}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
