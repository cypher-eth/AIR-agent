'use client';

import { WagmiProvider as WagmiProviderCore, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, sepolia],
    
    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    
    // Required App Info
    appName: 'AI Support WebApp',
    appDescription: 'Interactive AI support with voice interface and Web3 integration',
    appUrl: 'https://ai-support-webapp.vercel.app',
    appIcon: 'https://ai-support-webapp.vercel.app/icon.png',
  })
);

const queryClient = new QueryClient();

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProviderCore config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProviderCore>
  );
} 