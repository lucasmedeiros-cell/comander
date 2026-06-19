'use client';

import { motion } from 'framer-motion';
import { RANGES } from '@/lib/metrics';
import type { RangeKey } from '@/types';
import { cn } from '@/lib/utils';

interface RangeChipsProps {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
}

export function RangeChips({ value, onChange }: RangeChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1">
      {RANGES.map((r) => {
        const active = r.key === value;
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            className={cn(
              'relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId="range-active"
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
