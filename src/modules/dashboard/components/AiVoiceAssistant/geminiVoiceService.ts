import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { formatMoney } from '@/shared/utils/format';
import type { DashboardSummary } from '../../types';

export interface VisualPayload {
  type: 'CHAIRS_CHART' | 'REVENUE_CHART' | 'APPOINTMENTS_TABLE' | 'STOCK_TABLE' | 'DOCTORS_TABLE';
  title: string;
  data: unknown;
}

export interface VoiceAssistantResponse {
  spokenText: string;
  visual?: VisualPayload;
}

// Kalit faqat .env'dan olinadi (kodga yozilmaydi). Kalit bo'lmasa — brauzer ovozi va lokal javob ishlaydi.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';

const CANDIDATE_TEXT_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

const CANDIDATE_TTS_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-2.5-flash-preview-tts',
  'gemini-3.8-flash-lite-tts',
];

// Generatsiya qilingan ovozlarni tezkor xotirada saqlash (qayta-qayta generatsiya qilmaslik uchun)
const audioCache = new Map<string, string>();

let globalAudioCtx: AudioContext | null = null;

/**
 * Brauzerning audio kontekstini foydalanuvchi harakati bilan uyg'otish (Autoplay cheklovini yechish)
 */
export const unlockAudio = (): AudioContext | null => {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
      globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx.state === 'suspended') {
      void globalAudioCtx.resume();
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
};

/**
 * Sonlarni sof o'zbekcha so'zlarga aylantirish (ovozli sintezator raqamlarni ruscha o'qimasligi uchun)
 */
export const numberToUzbekWords = (n: number): string => {
  const units = ['', 'bir', 'ikki', 'uch', 'to‘rt', 'besh', 'olti', 'yetti', 'sakkiz', 'to‘qqiz'];
  const tens = ['', 'o‘n', 'yigirma', 'o‘ttiz', 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', 'to‘qson'];
  if (n === 0) return 'nol';
  let num = Math.abs(n);
  const parts: string[] = [];

  if (num >= 1000000000) {
    const b = Math.floor(num / 1000000000);
    parts.push(numberToUzbekWords(b) + ' milliard');
    num %= 1000000000;
  }
  if (num >= 1000000) {
    const m = Math.floor(num / 1000000);
    parts.push(numberToUzbekWords(m) + ' million');
    num %= 1000000;
  }
  if (num >= 1000) {
    const k = Math.floor(num / 1000);
    parts.push(numberToUzbekWords(k) + ' ming');
    num %= 1000;
  }
  if (num >= 100) {
    const h = Math.floor(num / 100);
    parts.push((h === 1 ? '' : units[h] + ' ') + 'yuz');
    num %= 100;
  }
  if (num >= 10) {
    parts.push(tens[Math.floor(num / 10)]);
    num %= 10;
  }
  if (num > 0) {
    parts.push(units[num]);
  }
  return parts.join(' ').trim();
};

/**
 * Tartib raqamlari (1-kabinet -> birinchi kabinet, 2-kabinet -> ikkinchi kabinet...)
 */
const ordinalUzbek = (n: number): string => {
  const ordinals: Record<number, string> = {
    1: 'birinchi',
    2: 'ikkinchi',
    3: 'uchinchi',
    4: 'to‘rtinchi',
    5: 'beshinchi',
    6: 'oltinchi',
    7: 'yettinchi',
    8: 'sakkizinchi',
    9: 'to‘qqizinchi',
    10: 'o‘ninchi',
  };
  return ordinals[n] || `${numberToUzbekWords(n)}-chi`;
};

/**
 * Ovozli o'qish uchun matnni sof o'zbek tili talaffuziga moslab tozalash:
 * - Barcha raqamlar so'zlar bilan yoziladi
 * - Foiz va belgilar matnga o'giriladi
 * - Ruscha yoki xorijiy aksent bartaraf qilinadi
 */
export const formatTextForUzbekVoice = (text: string): string => {
  const cleaned = text
    .replace(/Dr\./g, 'Doktor')
    .replace(/(\d+)-kabinet/gi, (_, n) => `${ordinalUzbek(parseInt(n, 10))} kabinet`)
    .replace(/(\d+)-qavat/gi, (_, n) => `${ordinalUzbek(parseInt(n, 10))} qavat`)
    .replace(/(\d+)%/g, (_, n) => `${numberToUzbekWords(parseInt(n, 10))} foiz`)
    .replace(/(\d+)\s*tasi/gi, (_, n) => `${numberToUzbekWords(parseInt(n, 10))}tasi`)
    .replace(/(\d+)\s*ta/gi, (_, n) => `${numberToUzbekWords(parseInt(n, 10))}ta`)
    .replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
      const min = parseInt(m, 10);
      return `soat ${numberToUzbekWords(parseInt(h, 10))}${min > 0 ? ` ${numberToUzbekWords(min)}` : ''}`;
    })
    .replace(/\b(\d[\d\s]*\d|\d)\b/g, (match) => {
      const cleanNum = match.replace(/\s+/g, '');
      const num = parseInt(cleanNum, 10);
      return !Number.isNaN(num) ? numberToUzbekWords(num) : match;
    });

  return cleaned.replace(/\s+/g, ' ').trim();
};

/**
 * Google Gemini Studio AI (gemini-3.8-flash-tts) orqali sof o'zbekcha tabiiy audio (WAV) hosil qilish
 */
export const generateGeminiAudio = async (text: string): Promise<string | null> => {
  const formatted = formatTextForUzbekVoice(text);

  if (audioCache.has(formatted)) {
    return audioCache.get(formatted)!;
  }

  if (!GEMINI_API_KEY) return null;

  for (const model of CANDIDATE_TTS_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: formatted,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Aoede',
                },
              },
            },
          },
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) {
        audioCache.set(formatted, b64);
        return b64;
      }
    } catch {
      // Keyingi modelga o'tish
    }
  }

  return null;
};

/**
 * Kutib olish nutqini oldindan yuklab keshga joylash (modal ochilganda nol kechikish bilan yangrashi uchun)
 */
export const preloadWelcomeAudio = (staffName = 'Administrator') => {
  const firstName = staffName.split(' ')[0] || 'Administrator';
  const welcomeText = `Assalomu alaykum ${firstName}! Oq Tabassum klinikasiga xush kelibsiz. Bugun klinikamizda jami o‘n to‘rtta qabul rejalashtirilgan, umumiy tushum to‘rt million sakkiz yuz ming so‘m, ikkinchi diagnostika kabineti esa hozirda bo‘sh turibdi. Sizga qanday yordam bera olaman?`;
  void generateGeminiAudio(welcomeText);
};

/**
 * Web Audio orqali Google AI Studio WAV audiosini ijro etish
 */
const playAudioBuffer = async (
  b64Wav: string,
  onEnd?: () => void,
  onAnalyser?: (analyser: AnalyserNode) => void,
): Promise<() => void> => {
  const ctx = unlockAudio();
  if (!ctx) throw new Error('No AudioContext');

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const binaryString = atob(b64Wav);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 64;
  source.connect(analyser);
  analyser.connect(ctx.destination);

  if (onAnalyser) {
    onAnalyser(analyser);
  }

  source.onended = () => {
    onEnd?.();
  };

  source.start(0);

  return () => {
    try {
      source.stop();
    } catch {
      // ignore
    }
  };
};

/**
 * Brauzer nutq sintezi zaxirasi:
 * RUSCHA OVOZ QAT'IYAN TAQIQLANGAN. Faqat o'zbek yoki turkiy tillar ovozi bo'lsa ishlatiladi.
 */
const fallbackSpeechSynthesis = (text: string, onEnd?: () => void): (() => void) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return () => {};
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.lang = 'uz-UZ';

  // Faqat o'zbek yoki lotin asosli turkiy tillar (tr, az) qidiriladi. Ruscha mutlaqo taqiqlangan!
  const voices = window.speechSynthesis.getVoices();
  const uzVoice = voices.find((v) => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return (
      lang.startsWith('uz') ||
      name.includes('uzbek') ||
      lang.startsWith('tr') ||
      name.includes('turkish') ||
      lang.startsWith('az')
    );
  });

  if (!uzVoice) {
    // Agar mos ovoz bo'lmasa, xunuk ruscha ovozni ishlatmaslik uchun sukut qilinadi
    onEnd?.();
    return () => {};
  }

  utterance.voice = uzVoice;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
};

/**
 * Google Studio AI token orqali aniq o'zbekcha talaffuzda gapirish
 */
export const speakText = (
  text: string,
  onEnd?: () => void,
  onAnalyser?: (analyser: AnalyserNode) => void,
): (() => void) => {
  let isCancelled = false;
  let stopBufferSource: (() => void) | null = null;
  let activeAudio: HTMLAudioElement | null = null;
  let synthCancel: (() => void) | null = null;

  const formattedText = formatTextForUzbekVoice(text);

  // 1. Google Studio AI (Gemini Flash TTS) orqali haqiqiy tabiiy ovoz olish
  generateGeminiAudio(formattedText)
    .then(async (b64) => {
      if (isCancelled) return;
      if (b64) {
        try {
          // Web Audio API orqali ijro etish (brauzer autoplay bloklamaydi)
          stopBufferSource = await playAudioBuffer(
            b64,
            () => {
              if (!isCancelled) onEnd?.();
            },
            onAnalyser,
          );
        } catch {
          // Zaxira: HTML5 Audio
          try {
            const audio = new Audio(`data:audio/wav;base64,${b64}`);
            activeAudio = audio;
            audio.onended = () => {
              if (!isCancelled) onEnd?.();
            };
            audio.play().catch(() => {
              if (!isCancelled) onEnd?.();
            });
          } catch {
            if (!isCancelled) onEnd?.();
          }
        }
      } else {
        // Zaxira: Web Speech API (faqat o'zbek/turkiy ovoz, ruscha mutlaqo yo'q)
        synthCancel = fallbackSpeechSynthesis(formattedText, onEnd);
      }
    })
    .catch(() => {
      if (!isCancelled) onEnd?.();
    });

  return () => {
    isCancelled = true;
    if (stopBufferSource) {
      stopBufferSource();
      stopBufferSource = null;
    }
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    synthCancel?.();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
};

/**
 * Google Gemini API orqali klinika ma'lumotlariga asoslangan ovozli va vizual javob olish
 */
export const askGeminiVoice = async (
  userSpeech: string,
  staffName = 'Administrator',
  summary?: DashboardSummary,
): Promise<VoiceAssistantResponse> => {
  if (!GEMINI_API_KEY) return fallbackResponse(userSpeech);

  const today = dayjs().format('YYYY-MM-DD');
  const todayAppts = mockDb.appointments.filter(
    (a) => dayjs(a.start).isSame(dayjs(), 'day') && a.status !== 'CANCELLED',
  );

  const totalAppts = todayAppts.length || 14;
  const arrived = todayAppts.filter((a) => ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)).length || 6;
  const unconfirmed = todayAppts.filter((a) => a.status === 'SCHEDULED').length || 2;
  const rev = summary?.revenue?.value ? formatMoney(summary.revenue.value) : '4 800 000 so‘m';
  const rec = summary?.receivables?.value ? formatMoney(summary.receivables.value) : '1 250 000 so‘m';

  const systemContext = `
Siz «Oq Tabassum Dental» zamonaviy stomatologiya klinikasining aqlli, xushmuomala ovozli AI assistentisiz.
Sizga klinika xodimi: ${staffName} ovozli murojaat qilmoqda. Bugungi sana: ${today}.

Klinika real vaqt ko'rsatkichlari:
- Bugungi jami qabullar: ${totalAppts} ta (shulardan ${arrived} tasi yetib kelgan, ${unconfirmed} tasi hali tasdiqlanmagan).
- Bugungi tushum: ${rev}, kutilayotgan qarzlar: ${rec}.
- Kreslolar: 1-kabinet (Terapiya, bandlik 85%), 2-kabinet (Diagnostika, bandlik 65%, ayni damda bo‘sh), 3-kabinet (Jarrohlik, bandlik 78%), 4-kabinet (Ortodontiya, bandlik 90%).
- Shifokorlar: Dr. Rahimov O. (Bosh shifokor, 6 qabul), Dr. Karimova D. (Ortodont, 7 qabul), Dr. Saidov N. (Jarroh, 5 qabul).
- Ombor: 3 ta material minimal me'yordan kam (Anesteziya Artikain, Kompozit plomba, Jarrohlik ignalari).

QAT'IY KO'RSATMALAR:
1. FAQAT VA FAQAT SOF O'ZBEK ADABIY TILIDA JAVOB BERING. Ruscha, inglizcha yoki aralash so'zlarni mutlaqo ishlatmang.
2. OVOZDA O'QISH TABIIY VA ANIQ O'ZBEKCHA TALAFFUZDA CHIQISHI UCHUN: Barcha sonlar, raqamlar va foizlarni FAQAT o'zbekcha so'zlar bilan yozing!
   Misol: "14" deb emas, "o‘n to‘rtta" deb yozing;
   "4 800 000 so‘m" deb emas, "to‘rt million sakkiz yuz ming so‘m" deb yozing;
   "85%" deb emas, "sakson besh foiz" deb yozing;
   "2-kabinet" deb emas, "ikkinchi kabinet" deb yozing.
3. Javobingiz samimiy, do'stona, iliq va lo'nda bo'lsin (2-3 ta gap).
4. Quyidagi formatda toza JSON qaytaring:
{
  "spokenText": "Ovoz bilan tabiiy o'qiladigan, raqamlari so'z bilan ifodalangan sof o'zbekcha matn...",
  "visualType": "CHAIRS_CHART" | "REVENUE_CHART" | "APPOINTMENTS_TABLE" | "STOCK_TABLE" | "DOCTORS_TABLE" | null
}
Hech qanday qo'shimcha matnsiz, faqat toza JSON formatida javob bering.
`;

  for (const model of CANDIDATE_TEXT_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemContext}\n\nFoydalanuvchi so'rovi: "${userSpeech}"`,
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) continue;

      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed: { spokenText: string; visualType?: string };
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { spokenText: rawText };
      }

      const visual = buildVisualPayload(parsed.visualType || '', userSpeech, todayAppts, summary);

      return {
        spokenText: formatTextForUzbekVoice(parsed.spokenText || 'Sizga yordam berishdan mamnunman.'),
        visual,
      };
    } catch {
      // Keyingi modelga o'tish
    }
  }

  return fallbackResponse(userSpeech);
};

const buildVisualPayload = (
  vType: string,
  userSpeech: string,
  todayAppts: typeof mockDb.appointments,
  summary?: DashboardSummary,
): VisualPayload | undefined => {
  const q = userSpeech.toLowerCase();

  if (vType === 'CHAIRS_CHART' || q.includes('kreslo') || q.includes('kabinet')) {
    return {
      type: 'CHAIRS_CHART',
      title: 'Kreslolar va kabinetlar yuklamasi',
      data: [
        { name: '1-kabinet (Terapiya)', load: 85, count: 6, status: 'Qabulda' },
        { name: '2-kabinet (Diagnostika)', load: 65, count: 4, status: 'Bo‘sh' },
        { name: '3-kabinet (Jarrohlik)', load: 78, count: 5, status: 'Qabulda' },
        { name: '4-kabinet (Ortodontiya)', load: 90, count: 7, status: 'Qabulda' },
      ],
    };
  }

  if (vType === 'REVENUE_CHART' || q.includes('tushum') || q.includes('moliya')) {
    return {
      type: 'REVENUE_CHART',
      title: 'Haftalik tushum va qarzlar',
      data: summary?.weeklyRevenue || [
        { date: 'Du', amount: 3800000 },
        { date: 'Se', amount: 5200000 },
        { date: 'Cho', amount: 4400000 },
        { date: 'Pay', amount: 6100000 },
        { date: 'Ju', amount: 4800000 },
      ],
    };
  }

  if (vType === 'APPOINTMENTS_TABLE' || q.includes('qabul') || q.includes('tasdiq')) {
    return {
      type: 'APPOINTMENTS_TABLE',
      title: 'Bugungi dolzarb qabullar',
      data: todayAppts.slice(0, 4).map((a) => {
        const patient = mockDb.patients.find((p) => p.id === a.patientId);
        const doc = mockDb.staff.find((s) => s.id === a.doctorId);
        return {
          id: a.id,
          time: dayjs(a.start).format('HH:mm'),
          patient: patient ? `${patient.lastName} ${patient.firstName}` : 'Bemor',
          doctor: doc ? doc.fullName : 'Shifokor',
          status: a.status,
        };
      }),
    };
  }

  if (vType === 'STOCK_TABLE' || q.includes('ombor') || q.includes('dori')) {
    return {
      type: 'STOCK_TABLE',
      title: 'Kam qolgan ombor materiallari',
      data: [
        { name: 'Anesteziya Artikain 1:100 000', stock: '8 ampula', min: '20' },
        { name: 'Filtek Z250 Kompozit A2', stock: '2 dona', min: '5' },
        { name: 'Jarrohlik steril ignalari', stock: '12 dona', min: '30' },
      ],
    };
  }

  return undefined;
};

/** API ishlamay qolsa ham uzluksiz sof o'zbekcha javob beruvchi mahalliy intellekt */
const fallbackResponse = (q: string): VoiceAssistantResponse => {
  const query = q.toLowerCase();
  if (query.includes('kreslo') || query.includes('kabinet')) {
    return {
      spokenText:
        'Hozirda to‘rtta kabinetdan uchtasi band, ikkinchi diagnostika kabineti esa butunlay bo‘sh. Navbatdagi bemorni ikkinchi kabinetga olishingiz mumkin.',
      visual: {
        type: 'CHAIRS_CHART',
        title: 'Kreslolar va kabinetlar yuklamasi',
        data: [
          { name: '1-kabinet (Terapiya)', load: 85, count: 6, status: 'Qabulda' },
          { name: '2-kabinet (Diagnostika)', load: 65, count: 4, status: 'Bo‘sh' },
          { name: '3-kabinet (Jarrohlik)', load: 78, count: 5, status: 'Qabulda' },
          { name: '4-kabinet (Ortodontiya)', load: 90, count: 7, status: 'Qabulda' },
        ],
      },
    };
  }

  if (query.includes('tushum') || query.includes('moliya')) {
    return {
      spokenText:
        'Bugungi kunlik tushum to‘rt million sakkiz yuz ming so‘mni tashkil etmoqda. Kutilayotgan debitorlik qarzdorlik esa bir million ikki yuz ellik ming so‘m.',
      visual: {
        type: 'REVENUE_CHART',
        title: 'Haftalik tushum ko‘rsatkichlari',
        data: [
          { date: 'Du', amount: 3800000 },
          { date: 'Se', amount: 5200000 },
          { date: 'Cho', amount: 4400000 },
          { date: 'Pay', amount: 6100000 },
          { date: 'Ju', amount: 4800000 },
        ],
      },
    };
  }

  if (query.includes('ombor') || query.includes('dori') || query.includes('material')) {
    return {
      spokenText:
        'Omborda uchta asosiy material minimal me’yordan kam qolgan: Artikain anesteziyasi, kompozit plomba va jarrohlik ignalari.',
      visual: {
        type: 'STOCK_TABLE',
        title: 'Kam qolgan ombor materiallari',
        data: [
          { name: 'Anesteziya Artikain 1:100 000', stock: '8 ampula', min: '20' },
          { name: 'Filtek Z250 Kompozit A2', stock: '2 dona', min: '5' },
          { name: 'Jarrohlik steril ignalari', stock: '12 dona', min: '30' },
        ],
      },
    };
  }

  return {
    spokenText:
      'Bugun klinikamizda jami o‘n to‘rtta qabul rejalashtirilgan. Shulardan oltita bemor qabul qilindi, ikkitasi tasdiqlanmagan holatda turibdi.',
    visual: {
      type: 'APPOINTMENTS_TABLE',
      title: 'Bugungi qabullar holati',
      data: [
        { time: '09:30', patient: 'Alimov Jamshid', doctor: 'Dr. Rahimov O.', status: 'IN_PROGRESS' },
        { time: '11:00', patient: 'Karimova Zarina', doctor: 'Dr. Karimova D.', status: 'SCHEDULED' },
        { time: '14:00', patient: 'Saidov Bobur', doctor: 'Dr. Saidov N.', status: 'CONFIRMED' },
      ],
    },
  };
};
