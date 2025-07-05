 'use client';

import { usePrivy } from '@privy-io/react-auth';

export function Login() {
  const { login } = usePrivy();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">AI</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Cannes AirAgent</h1>
          <p className="text-white/70 text-lg">
            Interactive AI support with voice interface and Web3 integration
          </p>
        </div>

        <button
          onClick={login}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105"
        >
          Connect Wallet to Start
        </button>
      </div>
    </div>
  );
}