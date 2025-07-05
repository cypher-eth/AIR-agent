'use client';

import { privyConfig } from '@/lib/privy/privyConfig';
import { wagmiConfig } from '@/lib/wagmi/wagmiConfig';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { structuralSharing } from 'wagmi/query';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        structuralSharing,
        refetchOnWindowFocus: false,
      },
    },
  });
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={privyConfig}
    >
      <QueryClientProvider
        client={queryClient}
      >
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};