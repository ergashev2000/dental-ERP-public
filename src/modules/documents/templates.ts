import type { StatusMeta } from '@/shared/constants/status';
import { formatMoney } from '@/shared/utils/format';
import type { DocStatus, DocTemplate, DocTemplateKey } from './types';

export const DOC_STATUS: Record<DocStatus, StatusMeta> = {
  DRAFT: { label: 'Qoralama', tone: 'warning' },
  SIGNED: { label: 'Imzolangan', tone: 'success' },
};

/**
 * Hujjat shablonlari. Placeholder'lar: {bemor}, {sana}, {shifokor}, {klinika}, {tish}, {narx} —
 * bemor, joriy foydalanuvchi va klinika sozlamalaridan avtomatik to‘ldiriladi.
 */
export const DOC_TEMPLATES: DocTemplate[] = [
  {
    key: 'GENERAL_CONSENT',
    title: 'Umumiy rozilik (davolashga)',
    description: 'Birinchi tashrifda — ko‘rik va davolashga ixtiyoriy rozilik',
    fields: [],
    signer: 'patient',
    body: `Men, {bemor}, {klinika} klinikasida stomatologik ko‘rik va davolash o‘tkazilishiga ixtiyoriy ravishda rozilik beraman.

Shifokor {shifokor} menga quyidagilarni tushuntirdi:
— tashxis, taklif etilgan davolash rejasi va uning muqobil variantlari;
— mahalliy og‘riqsizlantirish (anesteziya) qo‘llanilishi va unga mumkin bo‘lgan reaksiyalar;
— davolashdan keyin vaqtinchalik sezuvchanlik, shish yoki noqulaylik bo‘lishi mumkinligi;
— shifokor tavsiyalariga amal qilmaslik davolash natijasiga ta’sir qilishi.

Allergiyalarim, surunkali kasalliklarim va qabul qilayotgan dorilarim haqida to‘liq ma’lumot berdim. Savollarimga tushunarli javob oldim.

Sana: {sana}`,
  },
  {
    key: 'IMPLANT_CONSENT',
    title: 'Implantatsiyaga rozilik',
    description: 'Dental implant o‘rnatish operatsiyasidan oldin',
    fields: ['tish', 'narx'],
    signer: 'patient',
    body: `Men, {bemor}, {tish} tish sohasiga dental implant o‘rnatish operatsiyasiga rozilik beraman.

Shifokor {shifokor} menga quyidagilarni tushuntirdi:
— operatsiya mahalliy anesteziya ostida o‘tkaziladi; implant suyak bilan 3–6 oy davomida birikadi;
— operatsiyadan keyin shish, og‘riq, ko‘karish va qon ketishi bo‘lishi mumkin;
— kamdan-kam hollarda implant suyak bilan birikmasligi, yallig‘lanish yoki sezuvchanlik o‘zgarishi kuzatilishi mumkin;
— chekish, og‘iz gigiyenasiga rioya qilmaslik va nazorat ko‘riklariga kelmaslik asoratlar xavfini oshiradi.

Davolashning taxminiy narxi: {narx}. Narx {klinika} prays-varag‘i asosida belgilangan.
Operatsiyadan keyingi tavsiyalarga amal qilish va nazorat ko‘riklariga kelish majburiyatini olaman.

Sana: {sana}`,
  },
  {
    key: 'EXTRACTION_CONSENT',
    title: 'Tish olib tashlashga rozilik',
    description: 'Ekstraksiya (shu jumladan aql tishi) oldidan',
    fields: ['tish'],
    signer: 'patient',
    body: `Men, {bemor}, {tish} tishni olib tashlash (ekstraksiya) muolajasiga rozilik beraman.
Shifokor {shifokor} menga tishni olib tashlash zarurati, muqobil davolash usullari va ulardan voz kechish oqibatlarini tushuntirdi.

Quyidagi mumkin bo‘lgan holatlardan xabardorman:
— muolajadan keyin og‘riq, shish, qon ketishi;
— tish katakchasining yallig‘lanishi (alveolit);
— pastki jag‘ tishlarida lab yoki til sezuvchanligining vaqtincha pasayishi;
— qo‘shni tish yoki plombaning shikastlanishi.

Muolajadan keyin 2 soat ovqatlanmaslik, 3 kun davomida issiq ichimlik, chekish va og‘ir jismoniy mehnatdan saqlanish kerakligini bilaman.

Sana: {sana}`,
  },
  {
    key: 'BRACES_CONTRACT',
    title: 'Breket davolash shartnomasi',
    description: 'Ortodontik davolash: muddat, narx, majburiyatlar',
    fields: ['narx'],
    signer: 'patient',
    body: `Breket tizimi bilan ortodontik davolash shartnomasi

{klinika} (keyingi o‘rinlarda — Klinika) va {bemor} (keyingi o‘rinlarda — Bemor) quyidagilar haqida kelishdilar:

1. Klinika Bemorga breket tizimi yordamida tishlar holatini to‘g‘rilash bo‘yicha ortodontik davolashni amalga oshiradi. Davolovchi shifokor — {shifokor}.
2. Davolash muddati taxminan 12–24 oy. Muddat organizm xususiyatlari va Bemorning tavsiyalarga rioya qilishiga bog‘liq.
3. Davolashning umumiy narxi: {narx}. To‘lov kelishilgan jadval asosida amalga oshiriladi. Breket sinishi yoki yo‘qolishi alohida to‘lanadi.
4. Bemor har 4–6 haftada korreksiyaga keladi, og‘iz gigiyenasiga rioya qiladi, qattiq va yopishqoq ovqatlardan saqlanadi, davolashdan keyin retenzion apparatni taqadi.
5. Klinika sifatli materiallar ishlatadi, davolash rejasi va jarayon haqida to‘liq ma’lumot beradi.
6. Bemor sababli davolash to‘xtatilsa, bajarilgan ishlar narxi qaytarilmaydi.

Sana: {sana}`,
  },
  {
    key: 'PRESCRIPTION',
    title: 'Retsept',
    description: 'Dori va tavsiyalar — chop etib bemorga beriladi',
    fields: [],
    signer: 'doctor',
    body: `Bemor: {bemor}
Tashxis:

Rp:
1. Ibuprofen 400 mg — og‘riq bo‘lsa, kuniga 3 mahal ovqatdan keyin, 3 kundan ko‘p emas
2. Xlorgeksidin 0,05% eritmasi — og‘izni chayish, kuniga 3 mahal, 7 kun

Shifokor: {shifokor}
Sana: {sana}`,
  },
];

export const docTemplate = (key: DocTemplateKey) => DOC_TEMPLATES.find((t) => t.key === key) ?? DOC_TEMPLATES[0]!;

export interface FillVars {
  bemor: string;
  sana: string;
  shifokor?: string;
  klinika: string;
  teeth?: number[];
  price?: number;
}

const BLANK = '________';

/** Shablon matnidagi placeholder'larni qiymatlar bilan almashtiradi (bo‘sh qiymat — chiziq) */
export const fillTemplate = (body: string, v: FillVars) => {
  const map: Record<string, string> = {
    bemor: v.bemor || BLANK,
    sana: v.sana,
    shifokor: v.shifokor || BLANK,
    klinika: v.klinika,
    tish: v.teeth?.length ? v.teeth.join(', ') : BLANK,
    narx: v.price ? formatMoney(v.price) : `${BLANK} so‘m`,
  };
  return body.replace(/\{(bemor|sana|shifokor|klinika|tish|narx)\}/g, (_, k: string) => map[k] ?? '');
};
