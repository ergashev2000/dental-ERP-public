import { Button, Drawer, Input } from 'antd';
import { ArrowRight, Bot, Send, Sparkles, X } from '@/shared/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import dayjs from '@/shared/lib/dayjs';
import type { DashboardSummary } from '../../types';
import { type AiChatMessage, queryAiAssistant } from './aiEngine';

interface Props {
  open: boolean;
  onClose: () => void;
  summary?: DashboardSummary;
  initialPrompt?: string;
}

const DEFAULT_SUGGESTIONS = [
  'Bugungi qabullar holati qanday?',
  'Qaysi shifokor eng band?',
  'Kritik ombor zaxiralari bormi?',
  'Bugungi tushum va qarzlar',
  'Kechikayotgan bemorlar bormi?',
];

export const AiCopilotDrawer = ({ open, onClose, summary, initialPrompt }: Props) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Assalomu alaykum! Men «Oq Tabassum» klinikasining intellektual AI assistentiman. Bugungi qabullar, shifokorlar bandligi, moliyaviy tushumlar va ombor zaxiralari bo‘yicha har qanday savolingizga yordam berishga tayyorman.',
      time: dayjs().format('HH:mm'),
      suggestions: DEFAULT_SUGGESTIONS.slice(0, 3),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = useCallback((textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: dayjs().format('HH:mm'),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // AI javobini generatsiya qilish (kichik kechikish bilan realistik effekt)
    setTimeout(() => {
      const response = queryAiAssistant(text, summary);
      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        time: dayjs().format('HH:mm'),
        actionLabel: response.actionLabel,
        actionLink: response.actionLink,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  }, [inputValue, summary]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && initialPrompt) {
      const timer = setTimeout(() => {
        handleSend(initialPrompt);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, initialPrompt, handleSend]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={460}
      closable={false}
      styles={{
        header: { display: 'none' },
        body: { padding: 0, background: 'var(--color-surface)' },
        content: { borderRadius: '40px 0 0 40px', overflow: 'hidden' },
      }}
    >
      <div className="flex h-full flex-col bg-surface">
        {/* Yuqori panel: sarlavha va yopish */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-lime text-on-lime">
              <Sparkles size={20} strokeWidth={1.5} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="m-0 text-base font-medium text-ink">AI Klinika Copilot</h3>
                <span className="size-2 rounded-full bg-success" />
              </div>
              <p className="m-0 text-xs text-muted">Stomatologiya boshqaruv maslahatchisi</p>
            </div>
          </div>
          <Button
            shape="circle"
            className="bg-subtle"
            icon={<X size={18} strokeWidth={1.5} />}
            onClick={onClose}
            aria-label="Yopish"
          />
        </div>

        {/* Xabarlar ro'yxati */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div key={m.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-[85%] rounded-card p-4 transition-all ${
                    isAi ? 'bg-subtle text-ink' : 'bg-ink text-on-ink'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm leading-relaxed">{m.text}</div>

                  {/* AI amaliyot tugmasi */}
                  {isAi && m.actionLink && m.actionLabel && (
                    <div className="mt-3 pt-2 border-t border-line">
                      <Link to={m.actionLink} onClick={onClose}>
                        <Button
                          type="primary"
                          size="small"
                          className="rounded-pill"
                          icon={<ArrowRight size={14} strokeWidth={1.5} />}
                        >
                          {m.actionLabel}
                        </Button>
                      </Link>
                    </div>
                  )}

                  <div className={`mt-1.5 text-xs ${isAi ? 'text-muted' : 'text-on-ink/60'}`}>
                    {m.time}
                  </div>
                </div>

                {/* AI tomonidan tavsiya etilgan keyingi savollar */}
                {isAi && m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-1">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSend(s)}
                        className="inline-flex h-7 items-center rounded-pill bg-subtle px-3 text-xs text-ink transition-colors hover:bg-neutral-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 rounded-card bg-subtle p-3 text-xs text-muted w-fit">
              <span className="size-1.5 rounded-full bg-ink/40 animate-bounce" />
              <span className="size-1.5 rounded-full bg-ink/40 animate-bounce delay-100" />
              <span className="size-1.5 rounded-full bg-ink/40 animate-bounce delay-200" />
              <span>AI tahlil qilmoqda...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Tezkor savollar menyusi (Pastda doimiy takliflar) */}
        <div className="border-t border-line px-5 py-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-muted no-scrollbar">
            <span className="shrink-0 flex items-center gap-1">
              <Bot size={14} strokeWidth={1.5} /> Savollar:
            </span>
            {DEFAULT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSend(s)}
                className="shrink-0 rounded-pill bg-subtle px-2.5 py-1 text-xs text-ink transition-colors hover:bg-neutral-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input maydoni */}
        <div className="border-t border-line p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Klinika bo‘yicha savol bering..."
              className="rounded-pill bg-subtle py-2 text-sm"
              variant="filled"
            />
            <Button
              type="primary"
              shape="circle"
              htmlType="submit"
              className="size-10 shrink-0"
              icon={<Send size={18} strokeWidth={1.5} />}
              aria-label="Yuborish"
            />
          </form>
        </div>
      </div>
    </Drawer>
  );
};
