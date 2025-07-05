'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  status: string;
}

export function Header({ status }: HeaderProps) {
  const { user, logout, authenticated } = usePrivy();
  const { address } = useAccount();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!authenticated || !address) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
          </div>

          {/* Status - Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <p className="text-center text-sm text-white/80">
                Status: <span className="font-medium text-white">{status}</span>
              </p>
            </div>
          </div>

          {/* User Address with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
            >
              <span className="text-white/90 text-sm font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 space-y-3">
                  {user?.email?.address && (
                    <>
                      {/* User Email */}
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5">
                        <User className="w-4 h-4 text-white/70" />
                        <span className="text-white/90 text-sm truncate">
                          {user?.email?.address}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-white/10"></div>
                    </>
                  )}
                  {/* Disconnect Button */}
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}