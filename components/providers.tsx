'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { cronosTestnet } from 'viem/chains';

export default function Providers({children}: {children: React.ReactNode}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
    
    // Validate required environment variables
    if (!appId || !clientId) {
        console.error('Missing Privy credentials. Please set NEXT_PUBLIC_PRIVY_APP_ID and NEXT_PUBLIC_PRIVY_CLIENT_ID in your .env file.');
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
                    <p className="text-gray-400 mb-2">Missing Privy credentials.</p>
                    <p className="text-sm text-gray-500">
                        Please set <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_PRIVY_APP_ID</code> and{' '}
                        <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_PRIVY_CLIENT_ID</code> in your .env file.
                    </p>
                    <p className="text-xs text-gray-600 mt-4">
                        Get your credentials from{' '}
                        <a href="https://dashboard.privy.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            Privy Dashboard
                        </a>
                    </p>
                </div>
            </div>
        );
    }
    
  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        defaultChain: cronosTestnet,
        supportedChains: [cronosTestnet],
        appearance: {
            theme: 'dark',
            accentColor: '#676FFF',
            logo: '/images/esport.png',
        },
        embeddedWallets: {
            ethereum: {
                createOnLogin: 'users-without-wallets', 
            },
        },
    }}
    >
      {children}
    </PrivyProvider>
  );
}