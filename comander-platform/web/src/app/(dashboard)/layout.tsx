'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DataProvider } from '@/lib/data-provider';
import { useAuth } from '@/lib/store';
import { useMounted } from '@/lib/use-mounted';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const mounted = useMounted();

  // Sin sesión → al login. La comprobación corre tras montar (cuando el store
  // de auth ya está rehidratado), para no rebotar ni quedarse colgado.
  useEffect(() => {
    if (mounted && !user) router.replace('/login');
  }, [mounted, user, router]);

  // El panel se renderiza en cuanto hay sesión; el spinner es solo transitorio
  // (pre-montaje o redirección), nunca un estado permanente.
  if (!mounted || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <DataProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
