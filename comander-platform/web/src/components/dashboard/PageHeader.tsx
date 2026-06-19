'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // acciones a la derecha
  /** 'lg' destaca el encabezado (p. ej. el Resumen ejecutivo del Inicio). */
  size?: 'default' | 'lg';
}

export function PageHeader({ title, subtitle, children, size = 'default' }: PageHeaderProps) {
  const lg = size === 'lg';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h2
          className={
            lg
              ? 'text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl'
              : 'text-xl font-bold tracking-tight text-foreground'
          }
        >
          {title}
        </h2>
        {subtitle && (
          <p className={lg ? 'mt-1.5 text-base text-muted-foreground' : 'mt-0.5 text-sm text-muted-foreground'}>
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </motion.div>
  );
}
