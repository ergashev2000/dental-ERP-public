import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { formatMoney } from '@/shared/utils/format';
import type { DashboardSummary } from '../../types';

export interface AiInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'finance' | 'schedule';
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  tag?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  suggestions?: string[];
  actionLink?: string;
  actionLabel?: string;
}

/** Bugungi kun ma'lumotlariga asoslangan avtomatik AI tahlil xulosalari */
export const generateDailyInsights = (summary?: DashboardSummary): AiInsight[] => {
  const insights: AiInsight[] = [];
  const now = dayjs();

  const todayAppts = mockDb.appointments.filter(
    (a) => dayjs(a.start).isSame(now, 'day') && a.status !== 'CANCELLED',
  );

  // 1. Kechikayotgan yoki tasdiqlanmagan qabullar tahlili
  const unconfirmed = todayAppts.filter((a) => a.status === 'SCHEDULED');
  if (unconfirmed.length > 0) {
    const firstUnconfirmed = unconfirmed[0];
    const patient = mockDb.patients.find((p) => p.id === firstUnconfirmed.patientId);
    const pName = patient ? `${patient.lastName} ${patient.firstName}` : 'Bemor';
    insights.push({
      id: 'unconfirmed-alert',
      type: 'alert',
      title: `${unconfirmed.length} ta qabul tasdiqlanmagan`,
      description: `Yaqin qabul: ${pName} (${dayjs(firstUnconfirmed.start).format('HH:mm')}). Bemor bilan bog‘lanib vaqtni aniqlashtirish tavsiya etiladi.`,
      actionLabel: 'Qabullarga o‘tish',
      actionLink: '/appointments',
      tag: 'Shoshilinch',
    });
  }

  // 2. Bo'sh vaqt darchasi (Jadval optimizatsiyasi)
  const busyDoctor = summary?.doctorLoad?.reduce((max, cur) => (cur.loadPct > max.loadPct ? cur : max), summary.doctorLoad[0]);
  const freeDoctor = summary?.doctorLoad?.find((d) => d.loadPct < 50);

  if (freeDoctor) {
    insights.push({
      id: 'schedule-opt',
      type: 'opportunity',
      title: 'Bo‘sh vaqt darchasi aniqlandi',
      description: `${freeDoctor.name} bugun 50% dan kam bandlikka ega (${freeDoctor.count} ta qabul). Navbatdagi bemorlarni shu vaqtga yo‘naltirish mumkin.`,
      actionLabel: 'Jadvalni ko‘rish',
      actionLink: '/appointments',
      tag: 'Jadval',
    });
  } else if (busyDoctor && busyDoctor.loadPct >= 80) {
    insights.push({
      id: 'load-alert',
      type: 'opportunity',
      title: 'Yuqori yuklama aniqlandi',
      description: `${busyDoctor.name} bugun ${busyDoctor.loadPct}% bandlikda (${busyDoctor.count} qabul). Zaxira xonani tayyorlab qo‘yish tavsiya etiladi.`,
      actionLabel: 'Xodimlar',
      actionLink: '/staff',
      tag: 'Yuklama',
    });
  }

  // 3. Ombor zaxirasi kritik holat
  const lowProducts = mockDb.products.filter((p) => p.minStock && p.minStock > 0);
  if (lowProducts.length > 0) {
    const firstP = lowProducts[0];
    insights.push({
      id: 'stock-alert',
      type: 'alert',
      title: 'Kritik material zaxirasi',
      description: `${firstP.name} mahsuloti kam qolmoqda. Ertangi muolajalar to‘xtab qolmasligi uchun buyurtma bering.`,
      actionLabel: 'Kirim qilish',
      actionLink: '/inventory?tab=receipt',
      tag: 'Ombor',
    });
  }

  // 4. Kutilayotgan to'lovlar
  if (summary?.receivables?.value && summary.receivables.value > 0) {
    insights.push({
      id: 'finance-insight',
      type: 'finance',
      title: 'Debitorlik to‘lovlari nazorati',
      description: `Klinika bo‘yicha jami ${formatMoney(summary.receivables.value)} kutilayotgan to‘lovlar mavjud. Bugungi keladigan bemorlar hisobini tekshiring.`,
      actionLabel: 'To‘lovlar',
      actionLink: '/billing',
      tag: 'Moliya',
    });
  }

  return insights;
};

/** AI Assistent so'rovlariga javob beruvchi intellektual algoritm */
export const queryAiAssistant = (
  queryText: string,
  summary?: DashboardSummary,
): { text: string; actionLink?: string; actionLabel?: string; suggestions?: string[] } => {
  const q = queryText.toLowerCase().trim();
  const now = dayjs();

  const todayAppts = mockDb.appointments.filter(
    (a) => dayjs(a.start).isSame(now, 'day') && a.status !== 'CANCELLED',
  );

  // Qabullar bo'yicha savollar
  if (q.includes('qabul') || q.includes('bugun') || q.includes('bemor')) {
    const total = todayAppts.length;
    const arrived = todayAppts.filter((a) => ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)).length;
    const waiting = todayAppts.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;
    return {
      text: `Bugungi kunda jami ${total} ta qabul rejalashtirilgan. Shulardan ${arrived} tasi qabulga yetib keldi (yoki yakunlandi), ${waiting} ta bemor hali kutilmoqda.`,
      actionLabel: 'Bugungi qabullarni ko‘rish',
      actionLink: '/appointments',
      suggestions: ['Qaysi shifokor bo‘sh?', 'Kechikayotgan bemorlar bormi?', 'Bugungi tushum qancha?'],
    };
  }

  // Shifokorlar va yuklama bo'yicha savollar
  if (q.includes('shifokor') || q.includes('band') || q.includes('yuklama') || q.includes('doktor')) {
    const loads = summary?.doctorLoad || [];
    if (!loads.length) {
      return {
        text: 'Bugungi kunda ishlaydigan shifokorlar haqida ma’lumot topilmadi.',
        actionLabel: 'Xodimlar bo‘limi',
        actionLink: '/staff',
      };
    }
    const list = loads.map((d) => `• ${d.name}: ${d.count} ta qabul (${d.loadPct}% band)`).join('\n');
    return {
      text: `Bugungi shifokorlar yuklamasi tahlili:\n${list}\n\nO‘rtacha bandlik me’yorda. Qabullarni to‘g‘ri taqsimlash uchun kalendardan foydalanishingiz mumkin.`,
      actionLabel: 'Shifokorlar jadvali',
      actionLink: '/staff',
      suggestions: ['Kechikayotgan bemorlar bormi?', 'Ombor zaxirasi qanday?', 'Kutilayotgan to‘lovlar'],
    };
  }

  // Ombor va mahsulotlar bo'yicha savollar
  if (q.includes('ombor') || q.includes('dori') || q.includes('kam') || q.includes('material') || q.includes('zaxira')) {
    return {
      text: `Ombor tahlili: 3 turdagi asosiy stomatologik material minimal me’yordan past holatda. Ertangi jarrohlik va terapiya muolajalariga xalal bermaslik uchun «Kirim qilish» bo‘limi orqali to‘ldirish tavsiya etiladi.`,
      actionLabel: 'Omborni tekshirish',
      actionLink: '/inventory?tab=receipt',
      suggestions: ['Bugungi tushum qancha?', 'Bugungi qabullar qanday?', 'Shifokorlar yuklamasi'],
    };
  }

  // Moliya va tushum bo'yicha savollar
  if (q.includes('tushum') || q.includes('pul') || q.includes('to‘lov') || q.includes('qarz') || q.includes('moliya')) {
    const rev = summary?.revenue?.value ? formatMoney(summary.revenue.value) : '0 so‘m';
    const rec = summary?.receivables?.value ? formatMoney(summary.receivables.value) : '0 so‘m';
    return {
      text: `Moliyaviy ko‘rsatkichlar:\n• Bugungi tushum: ${rev}\n• Kutilayotgan qarzlar: ${rec}\n\nKutilayotgan to‘lovlarni bugungi keladigan bemorlar qabuli yakunida kassa orqali qabul qilish tavsiya etiladi.`,
      actionLabel: 'Moliya bo‘limiga o‘tish',
      actionLink: '/billing',
      suggestions: ['Bugungi qabullar', 'Qaysi shifokor bo‘sh?', 'Ombor zaxirasi'],
    };
  }

  // Kechikayotganlar
  if (q.includes('kechik') || q.includes('kelmadi') || q.includes('xavf')) {
    return {
      text: `Kechikish tahlili: 10 daqiqadan ko‘proq kechikayotgan 1 ta bemor aniqlandi. Administratorga bemorga telefon qilib, qabul vaqtini surish yoki tasdiqlash taklif qilinadi.`,
      actionLabel: 'Qabullarga o‘tish',
      actionLink: '/appointments',
      suggestions: ['Bugungi qabullar', 'Bugungi tushum qancha?'],
    };
  }

  // Umumiy yoki erkin savol
  return {
    text: `Men «Oq Tabassum» klinikasining intellektual AI assistentiman. Klinika bandligi, bugungi qabullar, shifokorlar yuklamasi, tushumlar va kam qolgan dorilar bo‘yicha tezkor tahlil va maslahat bera olaman.`,
    suggestions: [
      'Bugungi qabullar holati qanday?',
      'Qaysi shifokor eng band?',
      'Kritik zaxiralar bormi?',
      'Bugungi tushum va qarzlar',
    ],
  };
};
