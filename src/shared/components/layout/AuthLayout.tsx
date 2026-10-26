import { CalendarDays, Package, Users, Wallet, type AppIcon } from '@/shared/icons';
import type { ReactNode } from 'react';
import { LogoMark, TOOTH_PATH } from './Logo';

const YEAR = new Date().getFullYear();

/** Birinchi plitka — lime (qatordagi yagona lime blok) */
const MODULES: { label: string; icon: AppIcon }[] = [
  { label: 'Qabullar', icon: CalendarDays },
  { label: 'Bemor kartalari', icon: Users },
  { label: 'To‘lovlar', icon: Wallet },
  { label: 'Ombor', icon: Package },
];

/** Lime Health: chapda kulrang panel (logo, sarlavha, modul plitkalari), o'ngda oq fonda forma */
export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <>
    <div className="min-h-screen bg-surface p-2 font-sans text-ink lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-2">
      <aside className="flex flex-col gap-8 rounded-block bg-panel p-5 sm:p-8 lg:min-h-[calc(100vh-16px)] lg:justify-between lg:p-8">
        <div className="flex items-center gap-3">
          <LogoMark size={48} className="rounded-full bg-ink" />
          <div className="leading-tight">
            <div className="text-base">Oq Tabassum Dental</div>
            <div className="text-xs text-muted">Klinika boshqaruv paneli</div>
          </div>
        </div>

        <h1 className="m-0 max-w-160 font-display text-[40px] font-medium leading-none tracking-[-0.04em] text-balance sm:text-[56px] xl:text-[64px]">
          Klinikangiz{' '}
          <span className="inline-grid h-[0.86em] w-[1.55em] place-items-center rounded-pill bg-lime align-[-0.1em]" aria-hidden>
            <svg viewBox="0 0 32 32" className="h-[0.6em] w-[0.6em]">
              <path d={TOOTH_PATH} fill="currentColor" />
            </svg>
          </span>{' '}
          <span className="text-muted">bitta tartibli joyda.</span>
        </h1>

        <ul className="m-0 hidden list-none grid-cols-2 gap-1.5 p-0 lg:grid">
          {MODULES.map(({ label, icon: Icon }, i) => (
            <li
              key={label}
              className={`flex h-36 flex-col justify-between rounded-card p-4 ${i === 0 ? 'bg-lime text-on-lime' : 'bg-surface'}`}
            >
              <span
                className={`grid size-10 place-items-center self-end rounded-full ${i === 0 ? 'bg-surface' : 'bg-subtle'}`}
                aria-hidden
              >
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <span className="text-[19px] leading-[1.05]">{label}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col items-center justify-center gap-10 px-3 py-10 sm:px-8">
        <div className="w-full max-w-110">{children}</div>
        <div className="text-xs text-muted">© {YEAR} Oq Tabassum Dental</div>
      </main>
    </div>
  </>
);
