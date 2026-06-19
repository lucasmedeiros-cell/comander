'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bot, Lightbulb, SendHorizonal, Sparkles, User2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataset } from '@/lib/data-provider';
import { useResolvedBusinesses } from '@/lib/business-store';
import { DEMO_ALERTS } from '@/lib/mock-data';
import {
  answerQuestion,
  buildAdvice,
  SUGGESTED_QUESTIONS,
  type Advice,
  type ChatMessage,
  type CopilotContext,
} from '@/lib/copilot';
import { cn } from '@/lib/utils';

const TONE_ACCENT: Record<NonNullable<ChatMessage['tone']>, string> = {
  good: 'border-success/30',
  bad: 'border-danger/30',
  neutral: 'border-border',
};

let idSeq = 0;
const nextId = () => `m${++idSeq}`;

export default function CopilotoPage() {
  const { businesses: base, transactions } = useDataset();
  const businesses = useResolvedBusinesses(base);

  const ctx: CopilotContext = React.useMemo(
    () => ({ businesses, transactions, alerts: DEMO_ALERTS }),
    [businesses, transactions]
  );

  const advice = React.useMemo(() => buildAdvice(ctx), [ctx]);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: nextId(),
      sender: 'assistant',
      text: 'Hola 👋 Soy tu Copiloto. Pregúntame sobre tus ventas, compras, ganancia, empresas o alertas y te respondo al instante con tus datos reales.',
    },
  ]);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = React.useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const userMsg: ChatMessage = { id: nextId(), sender: 'user', text };
      setMessages((m) => [...m, userMsg]);
      setInput('');
      setTyping(true);
      // Pequeño retardo para simular "pensando" y dar sensación conversacional.
      window.setTimeout(() => {
        const ans = answerQuestion(text, ctx);
        setMessages((m) => [
          ...m,
          { id: nextId(), sender: 'assistant', text: ans.text, bullets: ans.bullets, tone: ans.tone },
        ]);
        setTyping(false);
      }, 420);
    },
    [ctx]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title="IA Empresarial"
        subtitle="Tu asistente ejecutivo. Pregunta en lenguaje natural sobre tus ventas, compras, ganancias y tendencias, y recibe respuestas al instante."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Chat ── */}
        <Card className="flex h-[68vh] min-h-[520px] flex-col overflow-hidden lg:col-span-2">
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-border">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-purple text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base">Asistente COMANDER</CardTitle>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success" /> Motor local · sin enviar datos a la nube
              </p>
            </div>
          </CardHeader>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
            </AnimatePresence>
            {typing && <TypingBubble />}
          </div>

          {/* Sugerencias rápidas */}
          <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUGGESTED_QUESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Enviar"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </form>
        </Card>

        {/* ── Modo Consejero ── */}
        <Card className="flex flex-col">
          <CardHeader className="space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-warning" /> Modo Consejero
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Recomendaciones automáticas a partir de tus datos de este mes.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 overflow-y-auto">
            {advice.map((a, i) => (
              <AdviceCard key={a.id} advice={a} index={i} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === 'user';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex items-start gap-2.5', isUser && 'flex-row-reverse')}
    >
      <span
        className={cn(
          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
          isUser ? 'bg-muted text-muted-foreground' : 'bg-gradient-to-br from-brand to-purple text-white'
        )}
      >
        {isUser ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>
      <div
        className={cn(
          'max-w-[82%] rounded-2xl border px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground border-transparent'
            : cn('rounded-tl-sm bg-card', msg.tone ? TONE_ACCENT[msg.tone] : 'border-border')
        )}
      >
        <p>{msg.text}</p>
        {msg.bullets && msg.bullets.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {msg.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-purple text-white">
        <Bot className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

const SEV_STYLE: Record<Advice['severity'], { dot: string; label: string; ring: string }> = {
  alta: { dot: 'bg-danger', label: 'Prioridad alta', ring: 'border-danger/30' },
  media: { dot: 'bg-warning', label: 'Prioridad media', ring: 'border-warning/30' },
  baja: { dot: 'bg-muted-foreground', label: 'Informativo', ring: 'border-border' },
  positiva: { dot: 'bg-success', label: 'Oportunidad', ring: 'border-success/30' },
};

function AdviceCard({ advice, index }: { advice: Advice; index: number }) {
  const s = SEV_STYLE[advice.severity];
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn('rounded-xl border bg-background/40 p-3', s.ring)}
    >
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', s.dot)} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">{advice.observation}</p>
      <p className="mt-1 text-xs text-muted-foreground">{advice.suggestion}</p>
      <Link
        href={advice.href}
        className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        {advice.cta} <ArrowRight className="h-3 w-3" />
      </Link>
    </motion.div>
  );
}
