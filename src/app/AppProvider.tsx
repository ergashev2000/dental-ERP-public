import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import uzUZ from 'antd/locale/uz_UZ';
import type { ReactNode } from 'react';
import '@/shared/lib/dayjs';
import { antdTheme } from '@/shared/theme/antdTheme';
import { queryClient, setUnauthorizedHandler } from '@/shared/lib/react-query';
import { setMockTokenGetter } from '@/shared/lib/mock/mockRequest';
import { configureHttp } from '@/shared/lib/axios';
import { getAuthToken, useAuthStore } from '@/modules/auth/store/authStore';

// Token manbasi: mock "backend" va axios uchun bitta
const logout = () => {
  useAuthStore.getState().logout();
  queryClient.clear();
};
setMockTokenGetter(getAuthToken);
configureHttp({ getToken: getAuthToken, onUnauthorized: logout });
setUnauthorizedHandler(logout);

/**
 * Provayderlar tartibi:
 * StyleProvider(layer) → antd stillari `@layer antd` ga tushadi va Tailwind preflight ularni buzmaydi.
 * NuqsAdapter router ichida (RootLayout) ulanadi.
 */
export const AppProvider = ({ children }: { children: ReactNode }) => (
  <StyleProvider layer>
    <ConfigProvider
      theme={antdTheme}
      locale={uzUZ}
      variant="filled"
      form={{ validateMessages: { required: 'Majburiy maydon' } }}
    >
      <AntApp>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  </StyleProvider>
);
