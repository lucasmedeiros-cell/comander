'use client';

import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { ThemeApplier } from '@/components/theme-applier';
import { PwaRegister } from '@/components/pwa-register';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <ThemeApplier />
      <PwaRegister />
      <TooltipProvider delayDuration={150}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                'group rounded-xl border border-border bg-card text-card-foreground shadow-lg',
              description: 'text-muted-foreground',
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
