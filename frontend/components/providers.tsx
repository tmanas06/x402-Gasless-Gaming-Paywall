'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { cronosTestnet } from '@/lib/viem';

export default function Providers({children}: {children: React.ReactNode}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
    
    // Validate required environment variables
    if (!appId || !clientId) {
        console.error('Missing Privy credentials. Please set NEXT_PUBLIC_PRIVY_APP_ID and NEXT_PUBLIC_PRIVY_CLIENT_ID in your .env file.');
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center p-8 max-w-lg">
                    <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
                    <p className="text-gray-400 mb-2">Missing Privy credentials.</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Set <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_PRIVY_APP_ID</code> and{' '}
                        <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_PRIVY_CLIENT_ID</code> in your <code className="bg-gray-800 px-1 rounded">.env</code> (or <code className="bg-gray-800 px-1 rounded">.env.local</code>).
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                        Get both values from your app settings in the{' '}
                        <a href="https://dashboard.privy.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            Privy Dashboard
                        </a>
                        . Use the <strong>App ID</strong> and <strong>Client ID</strong> shown there (do not swap them).
                    </p>
                    <p className="text-xs text-amber-200/90">
                        If you see &quot;Missing or invalid Privy app client ID&quot; or a 400 from Privy, the App ID or Client ID is wrong or the app is inactive. Create a new app in the dashboard or fix the IDs, then restart the dev server.
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