// Formateadores en español (es-CO). Solo dos monedas: Bolivianos y Dólares.

export type Currency = 'BOB' | 'USD';

// Los montos base están en Bolivianos. Para mostrar en USD se divide por el
// tipo de cambio. (Tipo de cambio referencial Bs por 1 US$.)
const RATE_BS_PER_USD = 6.96;
const SYMBOL: Record<Currency, string> = { BOB: 'Bs', USD: 'US$' };

export function money(
  value: number,
  opts?: { compact?: boolean; decimals?: number; currency?: Currency }
): string {
  const { compact = false, decimals, currency = 'BOB' } = opts ?? {};
  const amount = currency === 'USD' ? value / RATE_BS_PER_USD : value;
  const n = new Intl.NumberFormat('es-CO', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals ?? (compact ? 1 : 0),
  }).format(amount);
  return `${SYMBOL[currency]} ${n}`;
}

export function number(value: number, compact = false): string {
  return new Intl.NumberFormat('es-CO', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
}

export function percent(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function haceCuanto(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
