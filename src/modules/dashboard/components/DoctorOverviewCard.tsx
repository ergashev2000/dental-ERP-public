import { Button } from 'antd';
import { ArrowRight, Bot } from '@/shared/icons';
import { useState } from 'react';
import type { DashboardSummary } from '../types';
import { generateDailyInsights } from './AiAssistant/aiEngine';

interface Props {
  summary?: DashboardSummary;
  onOpenCopilot: (prompt?: string) => void;
}

/** Ink karta: klinika umumiy holati + AI kunlik fokus tavsiyasi (AI Copilot'ni ochadi) */
export const DoctorOverviewCard = ({ summary, onOpenCopilot }: Props) => {
  const insights = generateDailyInsights(summary);
  const [idx, setIdx] = useState(0);
  const insight = insights[idx] ?? insights[0];
  const doctors = summary?.doctorLoad ?? [];
  const avgLoad = doctors.length ? Math.round(doctors.reduce((s, d) => s + d.loadPct, 0) / doctors.length) : 0;

  return (
    <section className="flex flex-col gap-5 rounded-card bg-ink p-5 text-on-ink">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-on-dark-subtle">
            <Bot size={20} strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">Kunlik fokus</div>
            <div className="truncate text-xs text-on-dark-muted">AI tavsiyasi bugungi ma’lumotlar asosida</div>
          </div>
        </div>
      </div>

      {/* Klinika umumiy ko'rsatkichlari */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Qabullar', value: summary?.today.total ?? '—' },
          { label: 'Shifokorlar', value: doctors.length || '—' },
          { label: 'O‘rtacha bandlik', value: doctors.length ? `${avgLoad}%` : '—' },
        ].map((s) => (
          <div key={s.label} className="min-w-0 rounded-md bg-on-dark-subtle px-3 py-2.5">
            <div className="truncate text-xs text-on-dark-muted">{s.label}</div>
            <div className="text-xl tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {insight ? (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-sm font-medium">{insight.title}</div>
            <p className="m-0 mt-1 text-xs leading-relaxed text-on-dark-muted">{insight.description}</p>
          </div>
          {insights.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {insights.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`inline-flex h-7.5 cursor-pointer items-center rounded-pill px-3 text-xs transition-colors duration-150 ${
                    i === idx ? 'bg-surface text-ink' : 'bg-on-dark-subtle text-on-ink hover:bg-surface/20'
                  }`}
                >
                  {it.tag || it.title}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="m-0 text-xs text-on-dark-muted">Bugun alohida e’tibor talab qiladigan holat yo‘q.</p>
      )}

      <Button
        onClick={() => onOpenCopilot(insight?.title)}
        className="self-start bg-surface text-ink hover:bg-subtle"
        icon={<ArrowRight size={18} strokeWidth={1.5} />}
        iconPosition="end"
      >
        AI bilan muhokama qilish
      </Button>
    </section>
  );
};
