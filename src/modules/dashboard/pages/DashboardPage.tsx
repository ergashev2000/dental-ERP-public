import { Button, Segmented } from 'antd';
import { Sparkles } from '@/shared/icons';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { ErrorState, PageHeader } from '@/shared/components/ui';
import { useCurrentUser, usePermission, useSession } from '@/shared/hooks/usePermission';
import { AiCopilotDrawer } from '../components/AiAssistant';
import { FloatingVoiceButton, VoiceAssistantModal, preloadWelcomeAudio } from '../components/AiVoiceAssistant';
import { AssistantDay } from '../components/views/AssistantDay';
import { DoctorDay } from '../components/views/DoctorDay';
import { OwnerAnalytics } from '../components/views/OwnerAnalytics';
import { ReceptionToday } from '../components/views/ReceptionToday';
import { useDashboardSummary } from '../hooks/useDashboard';

const TABS = ['today', 'analytics'] as const;
type Tab = (typeof TABS)[number];

/**
 * Bosh sahifa — rolga qarab:
 * registratura/administrator — "Bugun" (navbat), shifokor — "Mening kunim",
 * assistent — kreslolar, egasi (va tushum ruxsatli administrator) — "Tahlil".
 */
export const DashboardPage = () => {
  const session = useSession();
  const user = useCurrentUser();
  const role = user?.role;
  const canRevenue = usePermission('dashboard.revenue');
  const { data, isError, error, refetch } = useDashboardSummary();
  const firstName = session?.staffName.split(' ')[0];

  // Egasi — standart "Tahlil"; administrator tushum ruxsati bilan ikkalasini ham ko'radi
  const hasAnalytics = role === 'OWNER' || (role === 'ADMIN' && canRevenue);
  const [tabParam, setTab] = useQueryState('tab', parseAsStringLiteral(TABS));
  const tab: Tab = hasAnalytics ? (tabParam ?? (role === 'OWNER' ? 'analytics' : 'today')) : 'today';

  useEffect(() => {
    preloadWelcomeAudio(session?.staffName || 'Administrator');
  }, [session?.staffName]);

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState<string | undefined>(undefined);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const handleOpenCopilot = (prompt?: string) => {
    setCopilotPrompt(prompt);
    setCopilotOpen(true);
  };

  const date = dayjs().format('dddd, D MMMM');
  const description =
    role === 'DOCTOR'
      ? `Mening kunim · ${date}`
      : role === 'ASSISTANT'
        ? `Bugungi kreslolar · ${date}`
        : `${date}${firstName ? ` · ${firstName}` : ''}`;

  const body =
    role === 'DOCTOR' && user ? (
      <DoctorDay staffId={user.staffId} />
    ) : role === 'ASSISTANT' ? (
      <AssistantDay />
    ) : tab === 'analytics' ? (
      <OwnerAnalytics summary={data} onOpenCopilot={handleOpenCopilot} />
    ) : (
      <ReceptionToday summary={data} />
    );

  return (
    <>
      <PageHeader
        title="Bosh sahifa"
        description={description.charAt(0).toUpperCase() + description.slice(1)}
        actions={
          <>
            {hasAnalytics && (
              <Segmented<Tab>
                value={tab}
                onChange={(v) => void setTab(v)}
                options={[
                  { value: 'today', label: 'Bugun' },
                  { value: 'analytics', label: 'Tahlil' },
                ]}
              />
            )}
            <Button type="primary" onClick={() => handleOpenCopilot()} icon={<Sparkles size={18} strokeWidth={1.5} />}>
              AI Copilot
            </Button>
          </>
        }
      />

      {/* pb — pastdagi suzuvchi ovozli tugma oxirgi kartani yopmasin */}
      <div className="pb-20">{isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : body}</div>

      {/* AI Copilot (yon panel) */}
      <AiCopilotDrawer
        open={copilotOpen}
        onClose={() => {
          setCopilotOpen(false);
          setCopilotPrompt(undefined);
        }}
        summary={data}
        initialPrompt={copilotPrompt}
      />

      {/* Ovozli AI assistent: suzuvchi tugma (pastki o'ng burchak) + modal */}
      <FloatingVoiceButton onClick={() => setVoiceModalOpen(true)} isOpen={voiceModalOpen} />
      <VoiceAssistantModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        staffName={session?.staffName}
        summary={data}
      />
    </>
  );
};
