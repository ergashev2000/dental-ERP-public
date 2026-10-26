import { Button, Input, Modal } from 'antd';
import {
  AiVoice,
  Mic,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from '@/shared/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SimpleColumn, SimpleDonut } from '@/shared/components/ui/Charts';
import { StatusTag } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/format';
import type { DashboardSummary } from '../../types';
import {
  askGeminiVoice,
  speakText,
  unlockAudio,
  type VisualPayload,
} from './geminiVoiceService';
import { VoiceVisualizer, type VisualizerState } from './VoiceVisualizer';

interface Props {
  open: boolean;
  onClose: () => void;
  staffName?: string;
  summary?: DashboardSummary;
}

interface MessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  visual?: VisualPayload;
}

interface ChairVisualItem {
  name: string;
  load: number;
  count: number;
  status: string;
}

interface RevenueVisualItem {
  date: string;
  amount: number;
}

interface ApptVisualItem {
  id?: string;
  time: string;
  patient: string;
  doctor: string;
  status: string;
}

interface StockVisualItem {
  name: string;
  stock: string;
  min: string;
}

interface BrowserSpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results?: { 0?: { 0?: { transcript?: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const QUICK_PROMPTS = [
  'Kreslolar yuklamasi va bo‘sh kabinetlar',
  'Bugungi tushum va qabullar qancha?',
  'Tasdiqlanmagan qabullar ro‘yxati',
  'Kam qolgan ombor dorilari',
];

export const VoiceAssistantModal = ({ open, onClose, staffName = 'Hamkasb', summary }: Props) => {
  const [visualizerState, setVisualizerState] = useState<VisualizerState>('idle');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const stopSpeechRef = useRef<(() => void) | null>(null);
  const recognitionRef = useRef<BrowserSpeechRec | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const firstName = staffName.split(' ')[0] || 'Hamkasb';

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // e'tiborsiz qoldirish
      }
      recognitionRef.current = null;
    }

    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }

    setVisualizerState((prev) => (prev === 'listening' ? 'idle' : prev));
  }, [audioStream]);

  // Modal ochilganda avtomatik kutib olish va qisqa hisobot berish
  useEffect(() => {
    if (!open) {
      stopSpeechRef.current?.();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // e'tiborsiz qoldirish
        }
        recognitionRef.current = null;
      }
      return;
    }

    const welcomeText = `Assalomu alaykum ${firstName}! Oq Tabassum klinikasiga xush kelibsiz. Bugun klinikamizda jami o‘n to‘rtta qabul rejalashtirilgan, umumiy tushum to‘rt million sakkiz yuz ming so‘m, ikkinchi diagnostika kabineti esa hozirda bo‘sh turibdi. Sizga qanday yordam bera olaman?`;

    const timer = setTimeout(() => {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: welcomeText,
          visual: {
            type: 'CHAIRS_CHART',
            title: 'Kreslolar joriy holati',
            data: [
              { name: '1-kabinet (Terapiya)', load: 85, count: 6, status: 'Qabulda' },
              { name: '2-kabinet (Diagnostika)', load: 65, count: 4, status: 'Bo‘sh' },
              { name: '3-kabinet (Jarrohlik)', load: 78, count: 5, status: 'Qabulda' },
              { name: '4-kabinet (Ortodontiya)', load: 90, count: 7, status: 'Qabulda' },
            ],
          },
        },
      ]);

      setVisualizerState('speaking');
      if (!isMuted) {
        stopSpeechRef.current = speakText(
          welcomeText,
          () => {
            setVisualizerState('idle');
            setAnalyserNode(null);
          },
          (node) => {
            setAnalyserNode(node);
          },
        );
      } else {
        setVisualizerState('idle');
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      stopSpeechRef.current?.();
    };
  }, [open, firstName, isMuted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, visualizerState]);

  // Ovozli so'rov yuborish
  const handleQuery = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q) return;

      unlockAudio();
      stopSpeechRef.current?.();

      const userMsg: MessageItem = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: q,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setVisualizerState('thinking');

      try {
        const res = await askGeminiVoice(q, staffName, summary);

        const aiMsg: MessageItem = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.spokenText,
          visual: res.visual,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setVisualizerState('speaking');

        if (!isMuted) {
          stopSpeechRef.current = speakText(
            res.spokenText,
            () => {
              setVisualizerState('idle');
              setAnalyserNode(null);
            },
            (node) => {
              setAnalyserNode(node);
            },
          );
        } else {
          setVisualizerState('idle');
        }
      } catch {
        setVisualizerState('idle');
      }
    },
    [staffName, summary, isMuted],
  );

  // Mikrofon orqali gaplashish
  const startListening = async () => {
    unlockAudio();
    stopSpeechRef.current?.();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setVisualizerState('listening');

      // Web Speech Recognition
      const SpeechRec =
        (window as unknown as { SpeechRecognition: new () => BrowserSpeechRec; webkitSpeechRecognition: new () => BrowserSpeechRec }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: new () => BrowserSpeechRec }).webkitSpeechRecognition;

      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = 'uz-UZ';
        rec.continuous = false;
        rec.interimResults = false;

        rec.onresult = (e) => {
          const transcript = e.results?.[0]?.[0]?.transcript || '';
          stopListening();
          if (transcript) {
            void handleQuery(transcript);
          }
        };

        rec.onerror = () => {
          stopListening();
        };

        rec.onend = () => {
          stopListening();
        };

        rec.start();
        recognitionRef.current = rec;
      } else {
        // Agar speech recognition qo'llab-quvvatlanmasa ovozli simulyatsiya
        setTimeout(() => {
          stopListening();
          void handleQuery('Kreslolar yuklamasi va bo‘sh kabinetlar qanday?');
        }, 3000);
      }
    } catch {
      setVisualizerState('idle');
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stopSpeechRef.current?.();
      setVisualizerState('idle');
    }
    setIsMuted(!isMuted);
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        stopSpeechRef.current?.();
        stopListening();
        onClose();
      }}
      footer={null}
      width="min(1120px, calc(100vw - 32px))"
      centered
      closable={false}
      styles={{
        content: {
          borderRadius: '32px',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--color-surface)',
        },
      }}
    >
      {/* Katta oyna: foydalanuvchiga o'qish va bosish oson bo'lsin */}
      <div className="flex h-[calc(100dvh-48px)] flex-col bg-surface">
        {/* Yuqori panel: Sarlavha, visualizer holati va tugmalar */}
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-on-lime sm:size-12">
              <AiVoice size={24} strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="m-0 truncate text-lg font-normal text-ink sm:text-xl">AI Ovozli Klinika Assistent</h3>
                <span className="hidden shrink-0 items-center gap-1 rounded-pill sm:inline-flex bg-ink/10 px-2 text-xs font-medium text-ink">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                  Google AI Studio • O‘zbekcha
                </span>
              </div>
              <p className="m-0 hidden text-sm text-muted sm:block">
                Ovozli boshqaruv, operativ hisobotlar va interaktiv chartlar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="grid size-11 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-neutral-200"
              aria-label={isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
            >
              {isMuted ? <VolumeX size={20} strokeWidth={1.5} /> : <Volume2 size={20} strokeWidth={1.5} />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeechRef.current?.();
                stopListening();
                onClose();
              }}
              className="grid size-11 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-neutral-200"
              aria-label="Yopish"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* AI Voice Visualizer bloki (Markaziy interaktiv ovoz to'lqini) */}
        <div className="flex flex-col items-center justify-center border-b border-line-soft bg-subtle/50 px-4 py-2 sm:px-6 sm:py-5">
          <VoiceVisualizer state={visualizerState} audioStream={audioStream} analyserNode={analyserNode} />
          <div className="mt-2 text-xs text-muted flex items-center gap-1.5 font-medium">
            {visualizerState === 'speaking' && (
              <>
                <span className="size-2 rounded-full bg-ink animate-pulse" />
                <span>AI assistent gapirmoqda...</span>
              </>
            )}
            {visualizerState === 'listening' && (
              <>
                <span className="size-2 rounded-full bg-danger animate-ping" />
                <span>Sizni tinglamoqdaman, gapiring...</span>
              </>
            )}
            {visualizerState === 'thinking' && (
              <>
                <span className="size-2 rounded-full bg-muted animate-spin" />
                <span>Gemini AI tahlil qilmoqda...</span>
              </>
            )}
            {visualizerState === 'idle' && (
              <span>Savol berish uchun mikrofon tugmasini bosing yoki yozing</span>
            )}
          </div>
        </div>

        {/* Xabarlar va Vizual Table/Chartlar ro'yxati */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 space-y-5 sm:px-6 md:px-10">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div key={m.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-full rounded-card p-4 transition-all sm:max-w-[85%] sm:p-5 ${
                    isAi ? 'bg-subtle text-ink' : 'bg-ink text-on-ink'
                  }`}
                >
                  <div className="text-base leading-relaxed whitespace-pre-line sm:text-lg">{m.text}</div>

                  {/* Agar javobda vizual chart yoki table bo'lsa */}
                  {isAi && m.visual && (
                    <div className="mt-3.5 pt-3 border-t border-line-soft">
                      <div className="mb-3 text-base text-ink flex items-center gap-2">
                        <Sparkles size={18} strokeWidth={1.5} />
                        {m.visual.title}
                      </div>

                      {/* 1. Kreslolar Dumaloq charti va ro'yxati */}
                      {m.visual.type === 'CHAIRS_CHART' && (
                        <div className="rounded-card bg-surface p-3.5 border border-line-soft">
                          <div className="grid items-center gap-6 sm:grid-cols-[240px_1fr]">
                            <SimpleDonut
                              height={220}
                              data={(m.visual.data as ChairVisualItem[]).map((d) => ({
                                chair: d.name,
                                value: d.count,
                              }))}
                              angleField="value"
                              colorField="chair"
                            />
                            <div className="flex flex-col gap-1.5">
                              {(m.visual.data as ChairVisualItem[]).map((d) => (
                                <div key={d.name} className="flex items-center justify-between gap-3 text-sm sm:text-base">
                                  <span className="min-w-0 truncate text-muted">{d.name}</span>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className="font-medium tabular-nums">{d.load}%</span>
                                    <StatusTag tone={d.status === 'Bo‘sh' ? 'success' : 'warning'}>
                                      {d.status}
                                    </StatusTag>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Tushum ustunli charti */}
                      {m.visual.type === 'REVENUE_CHART' && (
                        <div className="rounded-card bg-surface p-3 border border-line-soft">
                          <SimpleColumn
                            height={280}
                            data={m.visual.data as RevenueVisualItem[]}
                            xField="date"
                            yField="amount"
                            tooltip={{
                              items: [
                                {
                                  channel: 'y',
                                  name: 'Tushum',
                                  valueFormatter: (v: number) => formatMoney(v),
                                },
                              ],
                            }}
                          />
                        </div>
                      )}

                      {/* 3. Bugungi qabullar jadvali */}
                      {m.visual.type === 'APPOINTMENTS_TABLE' && (
                        <div className="rounded-card bg-surface p-2 border border-line-soft overflow-hidden">
                          <table className="w-full text-base text-left">
                            <thead>
                              <tr className="text-muted border-b border-line-soft">
                                <th className="px-3 py-2.5">Vaqt</th>
                                <th className="px-3 py-2.5">Bemor</th>
                                <th className="px-3 py-2.5">Shifokor</th>
                                <th className="px-3 py-2.5">Holat</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(m.visual.data as ApptVisualItem[]).map((row, idx) => (
                                <tr key={idx} className="border-b border-line-soft last:border-none">
                                  <td className="px-3 py-2.5 tabular-nums font-medium">{row.time}</td>
                                  <td className="px-3 py-2.5 font-medium">{row.patient}</td>
                                  <td className="px-3 py-2.5 text-muted">{row.doctor}</td>
                                  <td className="px-3 py-2.5">
                                    <StatusTag tone={row.status === 'COMPLETED' ? 'success' : 'info'}>
                                      {row.status}
                                    </StatusTag>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 4. Ombor materiallari jadvali */}
                      {m.visual.type === 'STOCK_TABLE' && (
                        <div className="rounded-card bg-surface p-2 border border-line-soft">
                          <table className="w-full text-base text-left">
                            <thead>
                              <tr className="text-muted border-b border-line-soft">
                                <th className="px-3 py-2.5">Material</th>
                                <th className="px-3 py-2.5">Qoldiq</th>
                                <th className="px-3 py-2.5">Min. me’yor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(m.visual.data as StockVisualItem[]).map((row, idx) => (
                                <tr key={idx} className="border-b border-line-soft last:border-none">
                                  <td className="px-3 py-2.5 font-medium">{row.name}</td>
                                  <td className="px-3 py-2.5 tabular-nums font-medium text-danger">{row.stock}</td>
                                  <td className="px-3 py-2.5 text-muted tabular-nums">{row.min}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Tezkor savollar menyusi */}
        <div className="border-t border-line-soft px-4 py-3 bg-surface sm:px-6 md:px-10">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1 sm:flex-wrap sm:overflow-visible">
            <span className="text-sm text-muted shrink-0 flex items-center gap-1.5">
              <Sparkles size={16} strokeWidth={1.5} /> Tezkor savollar:
            </span>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => void handleQuery(p)}
                className="shrink-0 rounded-pill bg-subtle px-4 py-2 text-sm text-ink transition-colors hover:bg-neutral-200 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Pastki boshqaruv: Katta mikrofon va matn kiritish */}
        <div className="border-t border-line-soft px-4 py-4 bg-surface sm:px-6 sm:py-5 md:px-10">
          <div className="flex items-center gap-3">
            {/* Markaziy mikrofon tugmasi */}
            <button
              type="button"
              onClick={() => {
                if (visualizerState === 'listening') {
                  stopListening();
                } else {
                  void startListening();
                }
              }}
              className={`flex size-14 shrink-0 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                visualizerState === 'listening'
                  ? 'bg-danger text-on-ink ring-4 ring-danger/25 animate-pulse'
                  : 'bg-ink text-on-ink hover:scale-105 active:scale-95'
              }`}
              aria-label={visualizerState === 'listening' ? 'To‘xtatish' : 'Ovoz yozish'}
            >
              <Mic size={26} strokeWidth={1.5} />
            </button>

            {/* Matnli input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleQuery(inputText);
              }}
              className="flex flex-1 items-center gap-2"
            >
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Savol bering yoki ovozli gapiring..."
                className="h-14 rounded-pill bg-subtle px-5 text-base"
                variant="filled"
              />
              <Button
                type="primary"
                shape="circle"
                htmlType="submit"
                className="!size-14 shrink-0"
                icon={<Send size={22} strokeWidth={1.5} />}
                aria-label="Yuborish"
              />
            </form>
          </div>
        </div>
      </div>
    </Modal>
  );
};
