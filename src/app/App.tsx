import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { Spin } from 'antd';
import { AppProvider } from './AppProvider';
import { router } from './router';

export const App = () => (
  <AppProvider>
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spin />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  </AppProvider>
);
