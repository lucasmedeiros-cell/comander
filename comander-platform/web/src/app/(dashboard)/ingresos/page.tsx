'use client';

import { TrendingUp } from 'lucide-react';
import { FlowSection } from '@/components/dashboard/FlowSection';

export default function IngresosPage() {
  return (
    <FlowSection
      type="INCOME"
      title="Ventas"
      subtitle="Ventas de todas tus empresas, por periodo y comparadas entre sí."
      icon={TrendingUp}
      accent="#2D7EFF"
    />
  );
}
