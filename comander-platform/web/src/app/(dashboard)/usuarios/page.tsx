'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, Shield, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DEMO_USERS } from '@/lib/mock-data';
import { ROLE_DESC, ROLE_LABEL } from '@/lib/labels';
import { haceCuanto, iniciales } from '@/lib/format';
import type { Role, User } from '@/types';
import { cn } from '@/lib/utils';

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'VIEWER'];

const ROLE_COLOR: Record<Role, string> = {
  SUPER_ADMIN: '#8B5CF6',
  ADMIN: '#2D7EFF',
  GERENTE: '#10B981',
  VIEWER: '#64748B',
};

// Matriz de permisos: 2 = total, 1 = solo lectura, 0 = sin acceso
const PERMISSIONS: Array<{ feature: string; perms: Record<Role, 0 | 1 | 2> }> = [
  { feature: 'Ver paneles y métricas', perms: { SUPER_ADMIN: 2, ADMIN: 2, GERENTE: 2, VIEWER: 1 } },
  { feature: 'Gestionar empresas', perms: { SUPER_ADMIN: 2, ADMIN: 2, GERENTE: 1, VIEWER: 0 } },
  { feature: 'Gestionar integraciones', perms: { SUPER_ADMIN: 2, ADMIN: 2, GERENTE: 0, VIEWER: 0 } },
  { feature: 'Generar reportes', perms: { SUPER_ADMIN: 2, ADMIN: 2, GERENTE: 2, VIEWER: 1 } },
  { feature: 'Configurar alertas', perms: { SUPER_ADMIN: 2, ADMIN: 2, GERENTE: 1, VIEWER: 0 } },
  { feature: 'Administrar usuarios', perms: { SUPER_ADMIN: 2, ADMIN: 1, GERENTE: 0, VIEWER: 0 } },
];

type DemoUser = User & { ultimoAcceso: string };

export default function UsuariosPage() {
  const [users, setUsers] = React.useState<DemoUser[]>(DEMO_USERS);
  const [roleFilter, setRoleFilter] = React.useState<Role | 'all'>('all');
  const visibleUsers = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);

  function toggleActive(id: string) {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)));
  }
  function changeRole(id: string, role: Role) {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)));
    toast.success('Rol actualizado');
  }
  function addUser(nombre: string, email: string, role: Role) {
    setUsers((us) => [
      { id: `u${Date.now()}`, nombre, email, role, activo: true, ultimoAcceso: new Date().toISOString() },
      ...us,
    ]);
    toast.success('Usuario invitado');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios y Roles" subtitle="Controla quién accede y qué puede hacer en COMANDER.">
        <AddUserDialog onAdd={addUser} />
      </PageHeader>

      {/* Tarjetas de roles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r, i) => (
          <motion.div key={r} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <button
              type="button"
              onClick={() => setRoleFilter((cur) => (cur === r ? 'all' : r))}
              className="block h-full w-full text-left"
            >
              <Card
                className={cn(
                  'h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-md',
                  roleFilter === r ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30'
                )}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${ROLE_COLOR[r]}1f`, color: ROLE_COLOR[r] }}>
                  <Shield className="h-5 w-5" />
                </span>
                <p className="mt-3 font-semibold">{ROLE_LABEL[r]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESC[r]}</p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {users.filter((u) => u.role === r).length} usuario(s)
                </p>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            Usuarios ({visibleUsers.length})
            {roleFilter !== 'all' && <span className="ml-2 text-xs font-normal text-muted-foreground">· {ROLE_LABEL[roleFilter]}</span>}
          </CardTitle>
          {roleFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setRoleFilter('all')}>Ver todos</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleUsers.map((u) => (
            <div key={u.id} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-purple text-xs font-bold text-white">
                  {iniciales(u.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Activo {haceCuanto(u.ultimoAcceso)}</span>
              <select
                value={u.role}
                onChange={(e) => changeRole(u.id, e.target.value as Role)}
                className="h-9 rounded-lg border border-input bg-background/50 px-2.5 text-xs focus-visible:border-primary focus-visible:outline-none"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <Switch checked={u.activo} onCheckedChange={() => toggleActive(u.id)} />
                <Badge variant={u.activo ? 'success' : 'muted'} className="text-[10px]">
                  {u.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Matriz de permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permisos configurables por rol</CardTitle>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-success" /> Total</span>
            {' · '}
            <span className="inline-flex items-center gap-1"><Minus className="h-3 w-3 text-warning" /> Solo lectura</span>
            {' · '}
            <span className="inline-flex items-center gap-1"><X className="h-3 w-3 text-muted-foreground" /> Sin acceso</span>
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-border text-xs text-muted-foreground">
                <th className="px-5 py-3 text-left font-medium">Funcionalidad</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-3 text-center font-medium">{ROLE_LABEL[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{row.feature}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-3 text-center">
                      <PermCell level={row.perms[r]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function PermCell({ level }: { level: 0 | 1 | 2 }) {
  if (level === 2) return <Check className="mx-auto h-4 w-4 text-success" />;
  if (level === 1) return <Minus className="mx-auto h-4 w-4 text-warning" />;
  return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
}

function AddUserDialog({ onAdd }: { onAdd: (n: string, e: string, r: Role) => void }) {
  const [open, setOpen] = React.useState(false);
  const [nombre, setNombre] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<Role>('GERENTE');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="h-4 w-4" /> Invitar usuario</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>Asigna un rol y envía la invitación por correo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre Apellido" />
          </div>
          <div className="space-y-1.5">
            <Label>Correo electrónico</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:border-primary focus-visible:outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">{ROLE_DESC[role]}</p>
          </div>
        </div>
        <Button
          disabled={!nombre || !email}
          onClick={() => { onAdd(nombre, email, role); setOpen(false); setNombre(''); setEmail(''); }}
        >
          <Plus className="h-4 w-4" /> Enviar invitación
        </Button>
      </DialogContent>
    </Dialog>
  );
}
