'use client';

import { TrendingDown } from 'lucide-react';
import { FlowSection } from '@/components/dashboard/FlowSection';

export default function EgresosPage() {
  return (
    <FlowSection
      type="EXPENSE"
      title="Compras"
      subtitle="Compras de todas tus empresas, por periodo y comparadas entre sí."
      icon={TrendingDown}
      accent="#F59E0B"
    />
  );
}
