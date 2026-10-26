import type { ToothHistory, ToothRecord } from '@/modules/dental-chart/types';
import type { TreatmentPlanItem } from '@/modules/treatments/types';
import { dt } from '../helpers';
import { servicesSeed, svc } from './catalog';

const rec = (patientId: string, tooth: number, conditions: ToothRecord['conditions'], surfaces: ToothRecord['surfaces'] = {}, note?: string): ToothRecord => ({
  patientId,
  tooth,
  conditions,
  surfaces,
  note,
  updatedAt: dt(-10, '12:00'),
});

export const toothRecordsSeed: ToothRecord[] = [
  // p1
  rec('p1', 16, ['FILLING'], { O: 'FILLING', M: 'FILLING' }),
  rec('p1', 26, ['CARIES'], { D: 'CARIES' }),
  rec('p1', 36, ['ROOT_CANAL', 'CROWN']),
  rec('p1', 47, ['CARIES', 'PLANNED'], { O: 'CARIES' }),
  rec('p1', 18, ['MISSING']),
  rec('p1', 28, ['MISSING']),
  rec('p1', 38, ['MISSING']),
  rec('p1', 48, ['MISSING']),
  // p2
  rec('p2', 11, ['PLANNED'], {}, 'Vinir rejalashtirilgan'),
  rec('p2', 21, ['PLANNED'], {}, 'Vinir rejalashtirilgan'),
  rec('p2', 14, ['CARIES'], { M: 'CARIES', O: 'CARIES' }),
  rec('p2', 24, ['FILLING'], { O: 'FILLING' }),
  // p3
  rec('p3', 36, ['MISSING'], {}, 'Implant rejalashtirilgan'),
  rec('p3', 46, ['MISSING']),
  rec('p3', 37, ['CROWN']),
  rec('p3', 45, ['EXTRACTION_PLANNED'], {}, 'Ildiz sinishi, olib tashlash kerak'),
  // p4 (bola)
  rec('p4', 54, ['CARIES'], { O: 'CARIES' }),
  rec('p4', 64, ['FILLING'], { O: 'FILLING' }),
  rec('p4', 75, ['CARIES'], { D: 'CARIES' }),
  rec('p4', 85, ['PLANNED']),
  // p7
  rec('p7', 13, ['CROWN']),
  rec('p7', 14, ['CROWN', 'ROOT_CANAL']),
  rec('p7', 15, ['CROWN']),
  rec('p7', 23, ['CROWN']),
  rec('p7', 24, ['CROWN', 'ROOT_CANAL']),
  rec('p7', 17, ['MISSING']),
];

const hist = (
  id: string,
  patientId: string,
  tooth: number,
  action: string,
  newValue: string,
  offset: number,
  doctorId: string,
  appointmentId?: string,
  oldValue?: string,
): ToothHistory => ({ id, patientId, tooth, action, oldValue, newValue, doctorId, appointmentId, createdAt: dt(offset, '11:00') });

export const toothHistorySeed: ToothHistory[] = [
  hist('th1', 'p1', 16, 'Muolaja: Kariesni davolash (kompozit plomba)', 'Plomba (O, M)', 0, 's1', 'a2', 'Karies'),
  hist('th2', 'p1', 36, "Holat o‘zgartirildi", 'Kanal davolangan, Koronka', -180, 's1'),
  hist('th3', 'p1', 47, "Holat o‘zgartirildi", 'Karies, Davolash rejalashtirilgan', -10, 's1', undefined, "Sog‘lom"),
  hist('th4', 'p1', 26, "Holat o‘zgartirildi", 'Karies (D)', -10, 's1', undefined, "Sog‘lom"),
  hist('th5', 'p2', 14, "Holat o‘zgartirildi", 'Karies (M, O)', -20, 's2', 'a90', "Sog‘lom"),
  hist('th6', 'p3', 45, "Holat o‘zgartirildi", 'Olib tashlash rejalashtirilgan', -15, 's2'),
  hist('th7', 'p7', 14, 'Muolaja: Pulpitni davolash (1 kanal)', 'Kanal davolangan, Koronka', -1, 's1', 'a13', 'Koronka'),
  hist('th8', 'p7', 23, 'Muolaja: Metallokeramik koronka', 'Koronka', -60, 's2', 'a91'),
  hist('th9', 'p7', 24, 'Muolaja: Metallokeramik koronka', 'Koronka, Kanal davolangan', -60, 's2', 'a91'),
  hist('th10', 'p4', 64, 'Muolaja: Sut tishini davolash', 'Plomba (O)', -35, 's4', 'a93', 'Karies'),
];

const price = (code: string) => servicesSeed.find((s) => s.code === code)!.price;

const plan = (
  id: string,
  patientId: string,
  stage: number,
  code: string,
  status: TreatmentPlanItem['status'],
  doctorId: string,
  tooth?: number,
  discount = 0,
  appointmentId?: string,
): TreatmentPlanItem => ({
  id,
  patientId,
  stage,
  tooth,
  serviceId: svc(code),
  price: price(code),
  discount,
  doctorId,
  status,
  appointmentId,
  createdAt: dt(-25, '12:00'),
});

export const treatmentPlanSeed: TreatmentPlanItem[] = [
  // p2 — 3 bosqichli reja
  plan('tp1', 'p2', 1, 'G401', 'DONE', 's2', undefined, 0, 'a90'),
  plan('tp2', 'p2', 1, 'T101', 'IN_PROGRESS', 's2', 14),
  plan('tp3', 'p2', 2, 'O303', 'PLANNED', 's2', 11, 10),
  plan('tp4', 'p2', 2, 'O303', 'PLANNED', 's2', 21, 10),
  plan('tp5', 'p2', 3, 'G402', 'PLANNED', 's2'),
  // p3 — implant rejasi
  plan('tp6', 'p3', 1, 'S201', 'PLANNED', 's3', 45),
  plan('tp7', 'p3', 2, 'S203', 'PLANNED', 's3', 36),
  plan('tp8', 'p3', 3, 'O302', 'PLANNED', 's2', 36),
  // p1
  plan('tp9', 'p1', 1, 'T101', 'PLANNED', 's1', 47),
  // p4
  plan('tp10', 'p4', 1, 'K501', 'PLANNED', 's4', 85),
];
