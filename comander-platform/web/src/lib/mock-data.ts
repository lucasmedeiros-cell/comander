import type {
  Alert,
  Business,
  Integration,
  Transaction,
  User,
} from '@/types';

// PRNG determinista (mulberry32) → datos estables entre servidor y cliente.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_USER: User = {
  id: 'u_demo',
  email: 'demo@comander.com',
  nombre: 'Carlos Mendoza',
  role: 'SUPER_ADMIN',
};

const BUSINESS_DEFS: Array<Omit<Business, 'lastSync' | 'apiStatus'> & {
  scale: number;
  margin: number;
  trend: number;
  apiStatus: Business['apiStatus'];
  syncMinAgo: number;
}> = [
  { id: 'b1', nombre: 'Petrobox Logística', sector: 'Logística', tipo: 'logistica', color: '#2D7EFF', status: 'ACTIVE', metaMensual: 240000, scale: 8200, margin: 0.32, trend: 0.12, apiStatus: 'CONNECTED', syncMinAgo: 3 },
  { id: 'b2', nombre: 'Aurora Retail', sector: 'Comercio', tipo: 'tienda', color: '#10B981', status: 'ACTIVE', metaMensual: 180000, scale: 6400, margin: 0.24, trend: 0.07, apiStatus: 'CONNECTED', syncMinAgo: 11 },
  { id: 'b3', nombre: 'NovaTech Studio', sector: 'Tecnología', tipo: 'servicios', color: '#8B5CF6', status: 'ACTIVE', metaMensual: 150000, scale: 5200, margin: 0.41, trend: 0.21, apiStatus: 'CONNECTED', syncMinAgo: 6 },
  { id: 'b4', nombre: 'Café del Puerto', sector: 'Gastronomía', tipo: 'restaurante', color: '#F59E0B', status: 'ACTIVE', metaMensual: 90000, scale: 3100, margin: 0.18, trend: -0.05, apiStatus: 'ERROR', syncMinAgo: 320 },
  { id: 'b5', nombre: 'Farmacia Vida', sector: 'Salud', tipo: 'farmacia', color: '#F97316', status: 'ACTIVE', metaMensual: 120000, scale: 4300, margin: 0.36, trend: 0.06, apiStatus: 'CONNECTED', syncMinAgo: 48 },
];

const INCOME_CATS = ['Suscripciones', 'Servicios', 'Productos', 'Contratos', 'Comisiones'];
const EXPENSE_CATS = ['Nómina', 'Proveedores', 'Marketing', 'Operación', 'Logística', 'Impuestos'];

const DAYS = 120;

// Ancla "hoy" a medianoche para mantener fechas estables (evita mismatch de hidratación).
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

let _cache: { businesses: Business[]; transactions: Transaction[] } | null = null;

export function getDataset(): { businesses: Business[]; transactions: Transaction[] } {
  if (_cache) return _cache;
  const today = startOfToday();
  const businesses: Business[] = BUSINESS_DEFS.map((b) => ({
    id: b.id,
    nombre: b.nombre,
    sector: b.sector,
    tipo: b.tipo,
    color: b.color,
    status: b.status,
    metaMensual: b.metaMensual,
    apiStatus: b.apiStatus,
    lastSync: new Date(Date.now() - b.syncMinAgo * 60000).toISOString(),
  }));

  const transactions: Transaction[] = [];
  let txId = 0;

  BUSINESS_DEFS.forEach((b, bi) => {
    const rand = mulberry32(1000 + bi * 97);
    for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset--) {
      const date = new Date(today - dayOffset * 86400000);
      const dow = date.getDay();
      // Estacionalidad: menos actividad en fin de semana (salvo gastronomía).
      const weekend = dow === 0 || dow === 6;
      const weekendFactor = b.sector === 'Gastronomía' ? 1.15 : weekend ? 0.55 : 1;
      // Tendencia a lo largo del periodo.
      const progress = (DAYS - dayOffset) / DAYS;
      const trendFactor = 1 + b.trend * progress;

      // Negocio inactivo: solo datos hasta hace ~20 días.
      if (b.status === 'INACTIVE' && dayOffset < 20) continue;

      // 1–3 ingresos por día
      const nIncome = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < nIncome; i++) {
        const noise = 0.6 + rand() * 0.9;
        const amount = Math.round(b.scale * weekendFactor * trendFactor * noise);
        transactions.push({
          id: `t${txId++}`,
          businessId: b.id,
          type: 'INCOME',
          amount,
          category: INCOME_CATS[Math.floor(rand() * INCOME_CATS.length)],
          description: 'Venta operativa',
          date: new Date(date.getTime() + i * 3600000).toISOString(),
        });
      }
      // 1–2 egresos por día
      const nExpense = 1 + Math.floor(rand() * 2);
      for (let i = 0; i < nExpense; i++) {
        const noise = 0.5 + rand() * 0.8;
        const amount = Math.round(b.scale * (1 - b.margin) * weekendFactor * noise);
        transactions.push({
          id: `t${txId++}`,
          businessId: b.id,
          type: 'EXPENSE',
          amount,
          category: EXPENSE_CATS[Math.floor(rand() * EXPENSE_CATS.length)],
          description: 'Compra operativa',
          date: new Date(date.getTime() + i * 3600000 + 1800000).toISOString(),
        });
      }
    }
  });

  _cache = { businesses, transactions };
  return _cache;
}

export const DEMO_INTEGRATIONS: Integration[] = [
  { id: 'i1', businessId: 'b1', type: 'STRIPE', status: 'CONNECTED', token: 'sk_live_••••4821', lastSync: new Date(Date.now() - 3 * 60000).toISOString() },
  { id: 'i2', businessId: 'b2', type: 'SHOPIFY', status: 'CONNECTED', token: 'shpat_••••9f2c', lastSync: new Date(Date.now() - 11 * 60000).toISOString() },
  { id: 'i3', businessId: 'b3', type: 'GOOGLE_ANALYTICS', status: 'CONNECTED', token: 'ga4_••••7710', lastSync: new Date(Date.now() - 6 * 60000).toISOString() },
  { id: 'i4', businessId: 'b4', type: 'QUICKBOOKS', status: 'ERROR', token: 'qb_••••0c13', lastSync: new Date(Date.now() - 320 * 60000).toISOString() },
  { id: 'i5', businessId: 'b1', type: 'CUSTOM_WEBHOOK', status: 'CONNECTED', token: 'whk_••••aa90', lastSync: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'i6', businessId: 'b5', type: 'STRIPE', status: 'DISCONNECTED', token: 'sk_live_••••1f55' },
];

export const DEMO_ALERTS: Alert[] = [
  { id: 'a1', type: 'API_ERROR', severity: 'CRITICAL', title: 'Error de API en Café del Puerto', message: 'La integración con QuickBooks devuelve errores 401. Revisa el token.', businessId: 'b4', read: false, createdAt: new Date(Date.now() - 18 * 60000).toISOString() },
  { id: 'a2', type: 'EMPRESA_DESCONECTADA', severity: 'WARNING', title: 'Mare Inmobiliaria sin sincronizar', message: 'No se reciben datos hace más de 48 horas.', businessId: 'b5', read: false, createdAt: new Date(Date.now() - 130 * 60000).toISOString() },
  { id: 'a3', type: 'EGRESOS_SUBEN', severity: 'WARNING', title: 'Compras al alza en Aurora Retail', message: 'Las compras subieron 14% frente a la semana pasada.', businessId: 'b2', read: false, createdAt: new Date(Date.now() - 240 * 60000).toISOString() },
  { id: 'a4', type: 'INGRESOS_CAEN', severity: 'INFO', title: 'Ventas estables en Café del Puerto', message: 'Variación menor al 3% en los últimos 7 días.', businessId: 'b4', read: true, createdAt: new Date(Date.now() - 600 * 60000).toISOString() },
  { id: 'a5', type: 'COMPORTAMIENTO_INUSUAL', severity: 'INFO', title: 'Pico de ingresos en NovaTech Studio', message: 'Crecimiento del 21% respecto al mes anterior. ¡Buen trabajo!', businessId: 'b3', read: true, createdAt: new Date(Date.now() - 900 * 60000).toISOString() },
];

export const DEMO_USERS: Array<User & { ultimoAcceso: string }> = [
  { id: 'u_demo', email: 'demo@comander.com', nombre: 'Carlos Mendoza', role: 'SUPER_ADMIN', activo: true, ultimoAcceso: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'u2', email: 'laura@comander.com', nombre: 'Laura Gómez', role: 'ADMIN', activo: true, ultimoAcceso: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: 'u3', email: 'andres@comander.com', nombre: 'Andrés Ruiz', role: 'GERENTE', activo: true, ultimoAcceso: new Date(Date.now() - 1440 * 60000).toISOString() },
  { id: 'u4', email: 'sofia@comander.com', nombre: 'Sofía Pérez', role: 'VIEWER', activo: false, ultimoAcceso: new Date(Date.now() - 10080 * 60000).toISOString() },
];
