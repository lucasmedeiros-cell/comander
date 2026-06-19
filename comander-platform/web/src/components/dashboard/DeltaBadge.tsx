'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { percent } from '@/lib/format';
import { cn } from '@/lib/utils';

interface DeltaBadgeProps {
  value: number;
  /** Si true, una subida es buena (verde). Si false (p.ej. egresos), subida = rojo. */
  positiveIsGood?: boolean;
  className?: string;
}

export function DeltaBadge({ value, positiveIsGood = true, className }: DeltaBadgeProps) {
  const flat = Math.abs(value) < 0.05;
  const good = flat ? null : value > 0 === positiveIsGood;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
        flat && 'bg-muted text-muted-foreground',
        good === true && 'bg-success/12 text-success',
        good === false && 'bg-danger/12 text-danger',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {percent(Math.abs(value))}
    </span>
  );
}
