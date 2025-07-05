import type {PrivyClientConfig} from '@privy-io/react-auth';
import { mainnet } from 'wagmi/chains';

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    // requireUserPasswordOnCreate: true,
    showWalletUIs: true
  },
  // loginMethods: ['wallet', 'email'],
  appearance: {
    showWalletLoginFirst: true
  },
  loginMethodsAndOrder: {
    primary: ['email', 'google', 'metamask'],          
  },
  defaultChain: mainnet,
  supportedChains: [mainnet],
};
