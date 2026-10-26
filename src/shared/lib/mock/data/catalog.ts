import type { Service } from '@/modules/services/types';
import type { Chair, ClinicSettings } from '@/modules/settings/types';
import type { Product, Supplier } from '@/modules/inventory/types';

export const chairsSeed: Chair[] = [
  { id: 'c1', name: '1-kabinet', isActive: true },
  { id: 'c2', name: '2-kabinet', isActive: true },
  { id: 'c3', name: '3-kabinet (xirurgiya)', isActive: true },
  { id: 'c4', name: '4-kabinet (ortodontiya)', isActive: true },
];

export const clinicSeed: ClinicSettings = {
  name: 'Oq Tabassum Dental',
  address: "Toshkent sh., Yunusobod tumani, Amir Temur ko‘chasi, 108",
  phone: '+998712000108',
  workDays: [1, 2, 3, 4, 5, 6],
  workStart: '09:00',
  workEnd: '19:00',
  slotStep: 15,
  paymentMethods: { CASH: true, TRANSFER: true, CARD: true },
  receiptHeader: 'Oq Tabassum Dental\nYunusobod, Amir Temur 108\nTel: +998 71 200 01 08',
  receiptFooter: "Xaridingiz uchun rahmat! Sog‘lom tabassum tilaymiz.",
};

export const productsSeed: Product[] = [
  { id: 'pr1', name: 'Kompozit material (A2)', sku: 'MAT-0001', category: 'Materiallar', unit: 'g', minStock: 20, location: 'Shkaf A / 1-polka' },
  { id: 'pr2', name: 'Adgeziv tizim', sku: 'MAT-0002', category: 'Materiallar', unit: 'ml', minStock: 5, location: 'Shkaf A / 1-polka' },
  { id: 'pr3', name: 'Anestetik (Artikain 4%)', sku: 'ANS-0001', category: 'Anestetiklar', unit: 'ampula', minStock: 50, location: 'Muzlatkich' },
  { id: 'pr4', name: "Endo fayllar to‘plami", sku: 'INS-0001', category: 'Asboblar', unit: "to‘plam", minStock: 5, location: 'Shkaf B / 2-polka' },
  { id: 'pr5', name: 'Gutapercha shtiftlar', sku: 'MAT-0003', category: 'Materiallar', unit: 'dona', minStock: 100, location: 'Shkaf B / 1-polka' },
  { id: 'pr6', name: 'Vaqtinchalik plomba materiali', sku: 'MAT-0004', category: 'Materiallar', unit: 'g', minStock: 10, location: 'Shkaf A / 2-polka' },
  { id: 'pr7', name: "Qo‘lqop (M)", sku: 'DSP-0001', category: 'Bir martalik', unit: 'juft', minStock: 200, location: 'Ombor xonasi' },
  { id: 'pr8', name: 'Niqob', sku: 'DSP-0002', category: 'Bir martalik', unit: 'dona', minStock: 200, location: 'Ombor xonasi' },
  { id: 'pr9', name: 'Gemostatik gubka', sku: 'SUR-0001', category: 'Materiallar', unit: 'dona', minStock: 10, location: 'Shkaf C' },
  { id: 'pr10', name: 'Implant (4.0×10)', sku: 'IMP-4010', category: 'Implantlar', unit: 'dona', minStock: 2, location: 'Seyf' },
  { id: 'pr11', name: 'Polirovka pastasi', sku: 'HYG-0001', category: 'Materiallar', unit: 'g', minStock: 50, location: 'Shkaf A / 3-polka' },
  { id: 'pr12', name: 'Oqartirish geli', sku: 'HYG-0002', category: 'Materiallar', unit: "to‘plam", minStock: 2, location: 'Muzlatkich' },
  { id: 'pr13', name: 'Germetik', sku: 'MAT-0005', category: 'Materiallar', unit: 'ml', minStock: 3, location: 'Shkaf A / 2-polka' },
  { id: 'pr14', name: 'Dezinfeksiya eritmasi', sku: 'DEZ-0001', category: 'Dezinfeksiya', unit: 'l', minStock: 5, location: 'Ombor xonasi' },
  { id: 'pr15', name: "Bir martalik so‘lak so‘rg‘ich", sku: 'DSP-0003', category: 'Bir martalik', unit: 'dona', minStock: 300, location: 'Ombor xonasi' },
  { id: 'pr16', name: 'Rentgen plyonkasi', sku: 'XRY-0001', category: 'Materiallar', unit: 'dona', minStock: 50, location: 'Rentgen xonasi' },
];

export const suppliersSeed: Supplier[] = [
  { id: 'sp1', name: 'Dental Market Toshkent', phone: '+998712345678', contact: 'Anvar Qosimov' },
  { id: 'sp2', name: 'MedStom Supply', phone: '+998909998877', contact: 'Olga Kim', note: 'Implantlar va anestetiklar' },
  { id: 'sp3', name: 'Uz Dent Pro', phone: '+998977776655', contact: 'Botir Yoqubov' },
];

const m = (productId: string, qty: number) => ({ productId, qty });

export const servicesSeed: Service[] = [
  { id: 'sv1', code: 'D001', name: "Birlamchi ko‘rik va konsultatsiya", category: 'Diagnostika', price: 100_000, durationMin: 30, perTooth: false, isActive: true, materials: [m('pr7', 1), m('pr8', 1)] },
  { id: 'sv2', code: 'D002', name: 'Panoramik rentgen (OPG)', category: 'Diagnostika', price: 150_000, durationMin: 15, perTooth: false, isActive: true, materials: [] },
  // Vizio uchun plyonka normasi: muddati o'tgan partiya USAGE'da ishlatilmasligini ko'rsatish uchun
  { id: 'sv3', code: 'D003', name: "Ko‘rish rentgeni (vizio)", category: 'Diagnostika', price: 50_000, durationMin: 15, perTooth: true, isActive: true, materials: [m('pr16', 1)] },
  { id: 'sv4', code: 'T101', name: 'Kariesni davolash (kompozit plomba)', category: 'Terapiya', price: 450_000, durationMin: 60, perTooth: true, isActive: true, materials: [m('pr1', 0.3), m('pr2', 0.1), m('pr3', 1)] },
  { id: 'sv5', code: 'T102', name: 'Pulpitni davolash (1 kanal)', category: 'Terapiya', price: 700_000, durationMin: 90, perTooth: true, isActive: true, materials: [m('pr3', 1), m('pr4', 1), m('pr5', 3)] },
  { id: 'sv6', code: 'T103', name: 'Kanalni qayta davolash', category: 'Terapiya', price: 900_000, durationMin: 90, perTooth: true, isActive: true, materials: [m('pr3', 1), m('pr4', 1)] },
  // Vaqtinchalik plomba normasi: material tugaganda yakunlash oynasida ogohlantirish chiqishi uchun
  { id: 'sv7', code: 'T104', name: 'Vaqtinchalik plomba', category: 'Terapiya', price: 150_000, durationMin: 20, perTooth: true, isActive: true, materials: [m('pr6', 1)] },
  { id: 'sv8', code: 'S201', name: 'Tish olish (oddiy)', category: 'Xirurgiya', price: 300_000, durationMin: 30, perTooth: true, isActive: true, materials: [m('pr3', 1), m('pr9', 1)] },
  { id: 'sv9', code: 'S202', name: 'Tish olish (murakkab, aql tishi)', category: 'Xirurgiya', price: 700_000, durationMin: 60, perTooth: true, isActive: true, materials: [m('pr3', 2), m('pr9', 1)] },
  { id: 'sv10', code: 'S203', name: "Implant o‘rnatish", category: 'Xirurgiya', price: 6_500_000, durationMin: 90, perTooth: true, isActive: true, materials: [m('pr10', 1), m('pr3', 2)] },
  { id: 'sv11', code: 'O301', name: 'Metallokeramik koronka', category: 'Ortopediya', price: 1_800_000, durationMin: 60, perTooth: true, isActive: true, materials: [] },
  { id: 'sv12', code: 'O302', name: 'Sirkoniy koronka', category: 'Ortopediya', price: 3_200_000, durationMin: 60, perTooth: true, isActive: true, materials: [] },
  { id: 'sv13', code: 'O303', name: 'Vinir (keramik)', category: 'Ortopediya', price: 3_500_000, durationMin: 60, perTooth: true, isActive: true, materials: [] },
  { id: 'sv14', code: 'G401', name: 'Professional gigiyena (skeyling + polirovka)', category: 'Gigiyena', price: 400_000, durationMin: 60, perTooth: false, isActive: true, materials: [m('pr11', 5)] },
  { id: 'sv15', code: 'G402', name: 'Oqartirish (ofisda)', category: 'Gigiyena', price: 1_500_000, durationMin: 90, perTooth: false, isActive: true, materials: [m('pr12', 1)] },
  { id: 'sv16', code: 'K501', name: 'Sut tishini davolash', category: 'Bolalar stomatologiyasi', price: 250_000, durationMin: 30, perTooth: true, isActive: true, materials: [m('pr1', 0.2)] },
  { id: 'sv17', code: 'K502', name: 'Fissuralarni germetizatsiya', category: 'Bolalar stomatologiyasi', price: 150_000, durationMin: 20, perTooth: true, isActive: true, materials: [m('pr13', 0.1)] },
  { id: 'sv18', code: 'R601', name: "Breket tizimi o‘rnatish (1 jag')", category: 'Ortodontiya', price: 6_000_000, durationMin: 120, perTooth: false, isActive: true, materials: [] },
  { id: 'sv19', code: 'R600', name: 'Ortodontik davolash (breket, to‘liq kurs)', category: 'Ortodontiya', price: 12_000_000, durationMin: 60, perTooth: false, isActive: true, materials: [] },
  { id: 'sv20', code: 'R602', name: 'Breket korreksiyasi (shartnoma ichida)', category: 'Ortodontiya', price: 0, durationMin: 30, perTooth: false, isActive: true, materials: [] },
];

/** Kod bo'yicha xizmat ID */
export const svc = (code: string) => servicesSeed.find((s) => s.code === code)!.id;
