import { Button } from 'antd';
import { ArrowRight, Bot, Sparkles, Zap } from '@/shared/icons';
import { useState } from 'react';
import type { DashboardSummary } from '../../types';
import { generateDailyInsights } from './aiEngine';

interface Props {
  summary?: DashboardSummary;
  onOpenCopilot: (initialPrompt?: string) => void;
}

/**
 * AI Klinika Assistent Hero Karta — Bento gridning eng yuqori ko'zga ko'ringan yagona LIME bloki.
 * Lime Health: bir qatorda bitta lime blok, bg-lime, text-on-lime, doira ikonkalar, pill tugmalar.
 */
export const AiHeroCard = ({ summary, onOpenCopilot }: Props) => {
  const insights = generateDailyInsights(summary);
  const [activeTab, setActiveTab] = useState(0);
  const activeInsight = insights[activeTab] || insights[0];

  const totalAppts = summary?.today.total ?? 0;
  const unconfirmed = summary?.unconfirmedToday ?? 0;

  return (
    <section className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-card bg-lime p-5 text-on-lime transition-all duration-200">
      {/* Yuqori qator: Ikonka, brending va jonli holat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-ink text-on-ink">
            <Sparkles size={20} strokeWidth={1.5} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-lg font-medium text-ink">AI Klinika Assistent</h2>
              <span className="inline-flex h-6 items-center gap-1.5 rounded-pill bg-ink/10 px-2.5 text-xs text-ink">
                <span className="size-1.5 rounded-full bg-ink animate-pulse" />
                Jonli tahlil
              </span>
            </div>
            <p className="m-0 text-xs text-ink/75">
              Bugungi kun uchun operativ AI tavsiyalari va xatarlar monitoringi
            </p>
          </div>
        </div>

        <Button
          type="primary"
          onClick={() => onOpenCopilot()}
          className="rounded-pill"
          icon={<Bot size={18} strokeWidth={1.5} />}
        >
          AI bilan maslahatlashish
        </Button>
      </div>

      {/* O'rta qism: Asosiy xulosa va interaktiv tavsiya kartochkasi */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="text-sm font-medium text-ink">
            {activeInsight ? activeInsight.title : `Bugun ${totalAppts} ta qabul rejalashtirilgan`}
          </div>
          <p className="m-0 text-sm leading-relaxed text-ink/85">
            {activeInsight
              ? activeInsight.description
              : `Barcha shifokorlar jadvali to‘liq ishga tushgan. Tasdiqlanmagan ${unconfirmed} ta qabul bo‘yicha qo‘ng‘iroq qilib, vaqtni aniqlashtirish tavsiya etiladi.`}
          </p>
        </div>

        {/* Tezkor amal tugmasi */}
        {activeInsight?.actionLabel && (
          <div className="shrink-0">
            <Button
              type="primary"
              onClick={() => onOpenCopilot(activeInsight.title)}
              className="rounded-pill"
              icon={<ArrowRight size={16} strokeWidth={1.5} />}
            >
              {activeInsight.actionLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Pastki qism: Tezkor insight selektorlari (Pill chiplar) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ink/10">
        <span className="text-xs text-ink/70 flex items-center gap-1 mr-1">
          <Zap size={14} strokeWidth={1.5} /> Tezkor tahlillar:
        </span>
        {insights.map((item, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`inline-flex h-7.5 cursor-pointer items-center gap-1.5 rounded-pill px-3 text-xs transition-colors duration-150 ${
                isActive
                  ? 'bg-ink text-on-ink font-medium'
                  : 'bg-ink/10 text-ink hover:bg-ink/15'
              }`}
            >
              <span>{item.tag || item.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
