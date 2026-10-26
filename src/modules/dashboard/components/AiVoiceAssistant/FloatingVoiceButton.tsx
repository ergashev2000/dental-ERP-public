import { AiVoice, Sparkles } from '@/shared/icons';
import { unlockAudio } from './geminiVoiceService';

interface Props {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingVoiceButton = ({ onClick, isOpen }: Props) => {
  if (isOpen) return null;

  const handleClick = () => {
    unlockAudio();
    onClick();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Kichik yordamchi matnli chip */}
      <div className="hidden items-center gap-1.5 rounded-pill bg-surface px-3 py-1.5 text-xs text-ink shadow-float sm:flex">
        <Sparkles size={16} strokeWidth={1.5} className="text-muted" />
        <span>AI ovozli assistent</span>
      </div>

      {/* Asosiy suzib yuruvchi dumaloq tugma */}
      <button
        type="button"
        onClick={handleClick}
        aria-label="AI Ovozli Assistentni ochish"
        className="group relative flex size-14 items-center justify-center rounded-full bg-ink text-on-ink shadow-float transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-ink/10"
      >
        <AiVoice size={26} strokeWidth={1.5} className="transition-transform group-hover:scale-110" />

        {/* Pulsatsiyalanuvchi aktiv indikator nishoni */}
        <span className="absolute top-0 right-0 flex size-3.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
          <span className="relative inline-flex size-3.5 rounded-full bg-lime border-2 border-ink" />
        </span>
      </button>
    </div>
  );
};
