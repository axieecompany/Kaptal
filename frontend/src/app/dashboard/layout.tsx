'use client';

import AIChatbot from '@/components/dashboard/AIChatbot';
import Sidebar from '@/components/dashboard/Sidebar';
import { AIAdvisorProvider } from '@/contexts/AIAdvisorContext';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AIAdvisorProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 min-w-0 w-full lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative">
          {children}
          <AIChatbot />
        </main>
      </div>
    </AIAdvisorProvider>
  );
}
