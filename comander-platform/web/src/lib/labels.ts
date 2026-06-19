import type { AlertType, ApiStatus, IntegrationType, Role } from '@/types';

export const API_STATUS: Record<ApiStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'muted'; dot: string }> = {
  CONNECTED: { label: 'Conectada', variant: 'success', dot: '#10B981' },
  ERROR: { label: 'Con errores', variant: 'danger', dot: '#EF4444' },
  DISCONNECTED: { label: 'Desconectada', variant: 'muted', dot: '#64748B' },
};

export const INTEGRATION_LABEL: Record<IntegrationType, string> = {
  STRIPE: 'Stripe',
  SHOPIFY: 'Shopify',
  QUICKBOOKS: 'QuickBooks',
  GOOGLE_ANALYTICS: 'Google Analytics',
  CUSTOM_WEBHOOK: 'Webhook personalizado',
};

export const ALERT_LABEL: Record<AlertType, string> = {
  INGRESOS_CAEN: 'Caída de ventas',
  EGRESOS_SUBEN: 'Aumento de compras',
  EMPRESA_DESCONECTADA: 'Empresa desconectada',
  API_ERROR: 'Error de API',
  COMPORTAMIENTO_INUSUAL: 'Comportamiento inusual',
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  VIEWER: 'Solo lectura',
};

export const ROLE_DESC: Record<Role, string> = {
  SUPER_ADMIN: 'Control total de la plataforma, empresas y usuarios.',
  ADMIN: 'Gestiona empresas, integraciones y reportes.',
  GERENTE: 'Consulta métricas y genera reportes de sus empresas.',
  VIEWER: 'Acceso de solo lectura a paneles y reportes.',
};
